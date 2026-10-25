-- V26: Admin-only onboarding queue. Confirmed accounts are not automatically approved.
-- Never expose auth.users to the browser or permit a self-approval route.
create or replace function public.list_pending_beta_signups()
returns table(email text, registered_at timestamptz)
language plpgsql stable security definer set search_path=''
as $pending_beta$
begin
 if (select auth.uid()) is null or not exists (
   select 1 from auth.users me
     join public.beta_allowlist a on a.email=lower(me.email)
   where me.id=(select auth.uid()) and a.enabled and a.role='admin'
 ) then
   raise exception 'Admin only' using errcode='42501';
 end if;
 return query
 select lower(u.email)::text, u.created_at
 from auth.users u
 left join public.beta_allowlist a on a.email=lower(u.email)
 where u.email is not null and u.email_confirmed_at is not null
   and (a.email is null or a.enabled=false)
 order by u.created_at desc limit 100;
end
$pending_beta$;
revoke all on function public.list_pending_beta_signups() from public,anon;
grant execute on function public.list_pending_beta_signups() to authenticated;
comment on function public.list_pending_beta_signups() is
  'Limited email-only admin queue for confirmed accounts without enabled beta allowlist';
