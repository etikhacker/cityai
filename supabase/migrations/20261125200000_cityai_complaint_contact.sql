-- Optional citizen contact details for tracking-code delivery and follow-up.
-- Both columns are nullable: existing rows and the current submit flow keep working.

alter table public.muracietler
  add column if not exists contact_email text,
  add column if not exists contact_phone text;

comment on column public.muracietler.contact_email is 'Optional e-mail address that receives the tracking code.';
comment on column public.muracietler.contact_phone is 'Optional phone number for operator follow-up; never shown publicly.';
