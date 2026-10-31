-- Audit B04: partner codes are private to their owner and administrators.
-- Previously every beta member could SELECT every partner code. A member who
-- received a code redeems it through claim_referral(); referral_guard keeps
-- enforcing the attribution window, eligibility and immutable attribution.
-- Review-only until a target-specific deployment plan is approved.
begin;

drop policy if exists codes_read on public.partner_codes;
create policy codes_read on public.partner_codes for select to authenticated
 using(partner_id=(select auth.uid()) or (select public.beta_role())='admin');

-- SECURITY DEFINER is required to resolve another partner's code without
-- exposing the code table. It returns nothing about the partner and gives one
-- generic error for unknown, inactive or own codes.
create or replace function public.claim_referral(p_code text)
 returns void language plpgsql security definer set search_path='' as $$
declare v_partner uuid;
begin
 if auth.uid() is null or public.beta_role() is null then raise exception 'Beta access required';end if;
 if p_code is null or char_length(btrim(p_code)) not between 6 and 64 then raise exception 'Referral code not available';end if;
 select c.partner_id into v_partner
  from public.partner_codes c
  join public.profiles p on p.id=c.partner_id
  join auth.users u on u.id=p.id
  join public.beta_allowlist a on a.email=lower(u.email) and a.enabled and a.role in ('partner','admin')
  where c.code=btrim(p_code);
 if v_partner is null or v_partner=auth.uid() then raise exception 'Referral code not available';end if;
 if exists(select 1 from public.referrals where referred_id=auth.uid()) then raise exception 'Referral already recorded';end if;
 -- referral_guard sets created_at, eligible_until, status and rejects expired attribution.
 insert into public.referrals(partner_id,referred_id,eligible_until)
  values(v_partner,auth.uid(),now());
end;
$$;
revoke all on function public.claim_referral(text) from public,anon;
grant execute on function public.claim_referral(text) to authenticated;
comment on function public.claim_referral(text) is
 'B04: redeem a partner code without reading partner_codes; attribution rules stay in hustle_private.referral_guard.';

commit;
