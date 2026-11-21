-- Reconstructed from read-only production grant metadata. The hosted project
-- already records this migration version/name; no user rows are accessed.
begin;

grant usage on schema public to anon, authenticated, service_role;

revoke all privileges on table
  public.muracietler,
  public.ai_analizler,
  public.media_fayllar,
  public.status_tarix
from public, anon, authenticated;

grant select, insert on table
  public.muracietler,
  public.ai_analizler,
  public.media_fayllar,
  public.status_tarix
to anon, authenticated;

grant all privileges on table
  public.muracietler,
  public.ai_analizler,
  public.media_fayllar,
  public.status_tarix
to service_role;

commit;
