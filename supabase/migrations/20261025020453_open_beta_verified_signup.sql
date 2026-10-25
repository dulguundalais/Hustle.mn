-- V46: Open beta onboarding for the ORIGINAL Hustle.mn database only.
-- New accounts require Supabase email confirmation, NOT manual admin approval.
-- The existing public.beta_allowlist remains the single access-control source for
-- existing RLS checks; role-specific management, bans and moderation stay in place.
begin;
create or replace function hustle_private.enroll_confirmed_open_beta_member()
returns trigger
language plpgsql
security definer
set search_path=''
as $open_beta$
begin
  -- Never grant access to unverified email signups, anonymous sessions or
  -- accounts banned by Supabase Auth.
  if new.email is null or btrim(new.email)='' or new.email_confirmed_at is null
     or coalesce(new.is_anonymous,false)
     or (new.banned_until is not null and new.banned_until>now())
  then
    return new;
  end if;

  -- Only a standard member may be auto-enrolled. Crucially, ON CONFLICT
  -- DO NOTHING does NOT re-enable manually disabled users or downgrade/upgrade
  -- existing admin/partner roles.
  insert into public.beta_allowlist(email,enabled,role)
  values(lower(btrim(new.email)),true,'member')
  on conflict(email) do nothing;
  return new;
end
$open_beta$;

-- No API client may invoke this privileged routine. Only auth.users trigger.
revoke all on function hustle_private.enroll_confirmed_open_beta_member() from public,anon,authenticated;

create trigger hustle_open_beta_on_verified_email
after insert or update of email,email_confirmed_at on auth.users
for each row execute function hustle_private.enroll_confirmed_open_beta_member();

comment on function hustle_private.enroll_confirmed_open_beta_member() is
  'Open beta: idempotent standard membership only after verified email; never overrides manual restrictions or privileged roles.';
commit;
