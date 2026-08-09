-- ═══════════════════════════════════════════════════════════════
-- Alexandra · waitlist table
-- Paste into the Supabase SQL editor and run. Safe, additive only.
--
-- WHY THIS EXISTS: the live page has been POSTing to /rest/v1/waitlist
-- since 2026-07-07 and that table has never existed. Every submission
-- returned 404 and the visitor saw "Něco se nepovedlo". Verified with the
-- service key on 2026-08-08: 33 tables in the project, no waitlist.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.waitlist (
  id         bigserial primary key,
  created_at timestamptz not null default now(),
  name       text,
  email      text not null,
  phone      text,
  source     text,                 -- which page sent it, e.g. alexandra-komunita
  note       text
);

-- One row per person. A second attempt returns 409, which the page now
-- reads as "you are already on the list" rather than an error.
create unique index if not exists waitlist_email_uniq on public.waitlist (lower(email));
create index if not exists waitlist_created on public.waitlist (created_at desc);

alter table public.waitlist enable row level security;

-- Insert-only from the public page: anyone may join, nobody may read.
-- Reading is deliberately left to the service key and the Google Sheet
-- mirror, because this table holds real names, e-mails and phone numbers.
drop policy if exists "waitlist: anyone can join" on public.waitlist;
create policy "waitlist: anyone can join" on public.waitlist
  for insert to anon, authenticated
  with check (email is not null and email <> '');

notify pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════════
-- AFTER RUNNING, verify from a terminal. The insert must return 201 and
-- the read must return empty, because the page may write but never read.
--
--   K=sb_publishable_mHXn8xM3D-2hIZ_kWkxzxw_ZLTFw2ls
--   U=https://jezlyszkgyesstczhlbo.supabase.co
--   curl -i -X POST "$U/rest/v1/waitlist" -H "apikey: $K" -H "Authorization: Bearer $K" \
--        -H "Content-Type: application/json" -d '{"email":"test@test.cz","source":"check"}'
--   curl -s "$U/rest/v1/waitlist?select=*" -H "apikey: $K" -H "Authorization: Bearer $K"
--
-- Then delete the test row from the dashboard.
-- ═══════════════════════════════════════════════════════════════
