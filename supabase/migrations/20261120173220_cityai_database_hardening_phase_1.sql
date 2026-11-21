-- Reconstructed schema snapshot from read-only production catalog metadata.
-- The hosted migration history already records this version/name, but the
-- original SQL file was not present in this repository. This file contains
-- schema/configuration only; it does not copy or seed complaint data.
begin;

create table if not exists public.muracietler (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique,
  category text not null,
  description text,
  priority text default 'medium',
  location text,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint muracietler_priority_check
    check (priority = any (array['low', 'medium', 'high', 'critical']::text[])),
  constraint muracietler_status_check
    check (status = any (array['pending', 'analyzing', 'open', 'in_progress', 'resolved', 'rejected']::text[]))
);

create table if not exists public.ai_analizler (
  id uuid primary key default gen_random_uuid(),
  muraciet_id uuid references public.muracietler(id) on delete cascade,
  problem_type text,
  severity text,
  description text,
  tags text[],
  confidence numeric,
  raw_response text,
  created_at timestamptz default now()
);

create table if not exists public.media_fayllar (
  id uuid primary key default gen_random_uuid(),
  muraciet_id uuid references public.muracietler(id) on delete cascade,
  storage_path text not null,
  file_type text,
  is_before boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.status_tarix (
  id uuid primary key default gen_random_uuid(),
  muraciet_id uuid references public.muracietler(id) on delete cascade,
  old_status text,
  new_status text,
  note text,
  created_at timestamptz default now()
);

create index if not exists idx_ai_analizler_muraciet_id
  on public.ai_analizler using btree (muraciet_id);
create index if not exists idx_media_fayllar_muraciet_id
  on public.media_fayllar using btree (muraciet_id);
create index if not exists idx_status_tarix_muraciet_id
  on public.status_tarix using btree (muraciet_id);

create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

drop trigger if exists muracietler_updated_at on public.muracietler;
create trigger muracietler_updated_at
before update on public.muracietler
for each row execute function public.update_updated_at();

alter table public.muracietler enable row level security;
alter table public.ai_analizler enable row level security;
alter table public.media_fayllar enable row level security;
alter table public.status_tarix enable row level security;

drop policy if exists muraciet_select_own on public.muracietler;
create policy muraciet_select_own on public.muracietler
  for select to anon using (true);
drop policy if exists muraciet_insert on public.muracietler;
create policy muraciet_insert on public.muracietler
  for insert to anon with check (true);
drop policy if exists ai_select on public.ai_analizler;
create policy ai_select on public.ai_analizler
  for select to anon using (true);
drop policy if exists ai_insert on public.ai_analizler;
create policy ai_insert on public.ai_analizler
  for insert to anon with check (true);
drop policy if exists media_select on public.media_fayllar;
create policy media_select on public.media_fayllar
  for select to anon using (true);
drop policy if exists media_insert on public.media_fayllar;
create policy media_insert on public.media_fayllar
  for insert to anon with check (true);
drop policy if exists status_select on public.status_tarix;
create policy status_select on public.status_tarix
  for select to anon using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'muraciet-media', 'muraciet-media', false, 20971520,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif','video/mp4','video/webm','video/quicktime']
)
on conflict (id) do nothing;

drop policy if exists cityai_media_anon_upload on storage.objects;
create policy cityai_media_anon_upload on storage.objects
  for insert to anon with check (bucket_id = 'muraciet-media');

commit;
