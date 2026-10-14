-- DRAFT ONLY: review and convert into a versioned Supabase CLI migration before applying.
-- Email allowlist is read-only to signed-in users; only privileged database administrators seed it.
create table if not exists public.beta_allowlist (
  email text primary key,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  constraint beta_allowlist_email_lowercase check (email = lower(email)),
  constraint beta_allowlist_email_valid check (position('@' in email) > 1)
);
alter table public.beta_allowlist enable row level security;
revoke all on public.beta_allowlist from anon, authenticated;
grant select on public.beta_allowlist to authenticated;
drop policy if exists "read own beta approval" on public.beta_allowlist;
create policy "read own beta approval" on public.beta_allowlist
for select to authenticated
using (email = lower((select auth.jwt() ->> 'email')));

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
grant select, insert, update on public.profiles to authenticated;
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated
using (id = (select auth.uid()));
drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles for insert to authenticated
with check (id = (select auth.uid()));
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Seed allowlist using trusted SQL editor, never expose admin mutation to clients.
-- insert into public.beta_allowlist(email) values ('approved@example.com');
