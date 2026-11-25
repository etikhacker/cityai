-- Which institution the complaint was forwarded to, so the operator can see and
-- re-send it without keeping that knowledge outside the system.
alter table public.muracietler
  add column if not exists assigned_department text,
  add column if not exists assigned_at timestamptz;

comment on column public.muracietler.assigned_department is 'Institution the complaint was forwarded to.';
comment on column public.muracietler.assigned_at is 'When the complaint was forwarded to that institution.';
