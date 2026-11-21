-- Apply this migration before deploying code that calls the RPC. Shared atomic
-- rate limits span all server instances. Keys are SHA-256 hashes
-- of the endpoint scope and client IP; raw addresses are never persisted.
begin;

create table if not exists public.cityai_rate_limit_buckets (
  key_hash text primary key check (key_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0)
);

alter table public.cityai_rate_limit_buckets enable row level security;
revoke all privileges on table public.cityai_rate_limit_buckets from public, anon, authenticated;
grant select, insert, update, delete on table public.cityai_rate_limit_buckets to service_role;

create or replace function public.cityai_check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_started_at timestamptz;
  v_count integer;
begin
  if p_key is null or p_limit is null or p_window_seconds is null
     or p_key !~ '^[0-9a-f]{64}$' or p_limit < 1 or p_limit > 1000
     or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Invalid rate-limit parameters.' using errcode = '22023';
  end if;

  insert into public.cityai_rate_limit_buckets as current_bucket (key_hash, window_started_at, request_count)
  values (p_key, v_now, 1)
  on conflict (key_hash) do update
    set window_started_at = case
          when current_bucket.window_started_at + make_interval(secs => p_window_seconds) <= v_now then v_now
          else current_bucket.window_started_at
        end,
        request_count = case
          when current_bucket.window_started_at + make_interval(secs => p_window_seconds) <= v_now then 1
          else current_bucket.request_count + 1
        end
  returning current_bucket.window_started_at, current_bucket.request_count
  into v_started_at, v_count;

  if random() < 0.01 then
    delete from public.cityai_rate_limit_buckets
    where window_started_at < v_now - interval '1 day';
  end if;

  return query select
    v_count <= p_limit,
    greatest(1, ceil(extract(epoch from (v_started_at + make_interval(secs => p_window_seconds) - v_now)))::integer);
end;
$$;

revoke all on function public.cityai_check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.cityai_check_rate_limit(text, integer, integer) to service_role;

commit;
