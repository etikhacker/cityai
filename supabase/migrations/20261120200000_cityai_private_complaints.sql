-- Keep complaint data available only to the trusted server-side API.
-- Apply after the application code with service-side authorization is deployed.
begin;

alter table public.muracietler enable row level security;
alter table public.ai_analizler enable row level security;
alter table public.media_fayllar enable row level security;
alter table public.status_tarix enable row level security;

drop policy if exists muraciet_select_own on public.muracietler;
drop policy if exists muraciet_insert on public.muracietler;
drop policy if exists ai_select on public.ai_analizler;
drop policy if exists ai_insert on public.ai_analizler;
drop policy if exists media_select on public.media_fayllar;
drop policy if exists media_insert on public.media_fayllar;
drop policy if exists status_select on public.status_tarix;
drop policy if exists cityai_media_anon_upload on storage.objects;

revoke all privileges on table
  public.muracietler,
  public.ai_analizler,
  public.media_fayllar,
  public.status_tarix
from anon, authenticated, public;
grant all privileges on table
  public.muracietler,
  public.ai_analizler,
  public.media_fayllar,
  public.status_tarix
to service_role;

-- A storage object may be attached to only one complaint, including under
-- concurrent submit requests. Existing duplicate paths cause this migration
-- to fail safely so they can be reviewed without deleting user data.
create unique index if not exists media_fayllar_storage_path_unique
  on public.media_fayllar (storage_path)
  where storage_path is not null;

-- Do not expose new public-schema tables/functions by default in future changes.
alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

-- Preserve the existing bucket as private and retain its established 20 MiB upload bound.
update storage.buckets
set public = false,
    file_size_limit = 20971520,
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
      'video/mp4', 'video/webm', 'video/quicktime'
    ]
where id = 'muraciet-media';

commit;
