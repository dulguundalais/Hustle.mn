-- B04: partner codes are private; referrals are claimed only through claim_referral().
-- Synthetic example.test identities only; the whole transaction rolls back.
begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('10000000-0000-4000-8000-000000000b01','b04-partner@example.test',now()),
 ('10000000-0000-4000-8000-000000000b02','b04-member@example.test',now()),
 ('10000000-0000-4000-8000-000000000b03','b04-late@example.test',now()),
 ('10000000-0000-4000-8000-000000000b04','b04-disabled-partner@example.test',now()),
 ('10000000-0000-4000-8000-000000000b05','b04-admin@example.test',now()),
 ('10000000-0000-4000-8000-000000000b06','b04-unverified@example.test',null),
 ('10000000-0000-4000-8000-000000000b07','b04-other@example.test',now());
insert into public.beta_allowlist(email,role,enabled) values
 ('b04-partner@example.test','partner',true),('b04-member@example.test','member',true),
 ('b04-late@example.test','member',true),('b04-disabled-partner@example.test','partner',true),
 ('b04-admin@example.test','admin',true),('b04-other@example.test','member',true)
 on conflict(email) do update set role=excluded.role,enabled=excluded.enabled;
insert into public.profiles(id,display_name,created_at) values
 ('10000000-0000-4000-8000-000000000b01','B04 Partner',now()),
 ('10000000-0000-4000-8000-000000000b02','B04 Member',now()),
 ('10000000-0000-4000-8000-000000000b03','B04 Late member',now()),
 ('10000000-0000-4000-8000-000000000b04','B04 Disabled partner',now()),
 ('10000000-0000-4000-8000-000000000b05','B04 Admin',now()),
 ('10000000-0000-4000-8000-000000000b06','B04 Unverified',now()),
 ('10000000-0000-4000-8000-000000000b07','B04 Other',now());

-- profile_guard stamps created_at; age one fixture past the attribution window
-- inside this rolled-back transaction only.
set local session_replication_role=replica;
update public.profiles set created_at=now()-interval '400 days' where id='10000000-0000-4000-8000-000000000b03';
set local session_replication_role=origin;
do $t$ begin
 if (select created_at from public.profiles where id='10000000-0000-4000-8000-000000000b03')>now()-interval '399 days'
 then raise exception 'TEST SETUP FAIL: late fixture not aged';end if;
end $t$;

set local role authenticated;

-- Partners create their own codes through the existing insert policy.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000b01","email":"b04-partner@example.test","role":"authenticated"}',true);
insert into public.partner_codes(partner_id,code) values(auth.uid(),'B04PARTNERCODE');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000b04","email":"b04-disabled-partner@example.test","role":"authenticated"}',true);
insert into public.partner_codes(partner_id,code) values(auth.uid(),'B04DISABLEDCODE');
reset role;
update public.beta_allowlist set enabled=false where email='b04-disabled-partner@example.test';
set local role authenticated;

-- Partner sees only its own code.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000b01","email":"b04-partner@example.test","role":"authenticated"}',true);
do $t$ begin
 if (select count(*) from public.partner_codes)<>1 or not exists(select 1 from public.partner_codes where code='B04PARTNERCODE')
 then raise exception 'TEST FAIL: partner must see exactly its own code';end if;
 begin perform public.claim_referral('B04PARTNERCODE');raise exception 'TEST FAIL: self referral accepted';
 exception when raise_exception then if SQLERRM like 'TEST FAIL%' then raise;end if;end;
end $t$;

-- A member cannot read any code, but can claim one exactly once.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000b02","email":"b04-member@example.test","role":"authenticated"}',true);
do $t$ declare r public.referrals; begin
 if exists(select 1 from public.partner_codes) then raise exception 'TEST FAIL: member can read partner codes';end if;
 begin perform public.claim_referral('B04-UNKNOWN-CODE');raise exception 'TEST FAIL: unknown code accepted';
 exception when raise_exception then if SQLERRM<>'Referral code not available' then raise;end if;end;
 begin perform public.claim_referral('B04DISABLEDCODE');raise exception 'TEST FAIL: disabled partner code accepted';
 exception when raise_exception then if SQLERRM<>'Referral code not available' then raise;end if;end;
 begin perform public.claim_referral(null);raise exception 'TEST FAIL: null code accepted';
 exception when raise_exception then if SQLERRM<>'Referral code not available' then raise;end if;end;
 perform public.claim_referral('  B04PARTNERCODE  ');
 select * into r from public.referrals where referred_id=auth.uid();
 if r.partner_id<>'10000000-0000-4000-8000-000000000b01' or r.status<>'pending' or r.eligible_until<=now()+interval '1 month'
 then raise exception 'TEST FAIL: server-owned referral attributes';end if;
 begin perform public.claim_referral('B04PARTNERCODE');raise exception 'TEST FAIL: duplicate referral accepted';
 exception when raise_exception then if SQLERRM<>'Referral already recorded' then raise;end if;end;
 update public.referrals set status='verified' where referred_id=auth.uid();
 if exists(select 1 from public.referrals where status='verified') then raise exception 'TEST FAIL: member reviewed own referral';end if;
end $t$;

-- Another member sees neither codes nor someone else's referral.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000b07","email":"b04-other@example.test","role":"authenticated"}',true);
do $t$ begin
 if exists(select 1 from public.partner_codes) or exists(select 1 from public.referrals)
 then raise exception 'TEST FAIL: unrelated member sees partner data';end if;
end $t$;

-- The attribution window still applies through the RPC.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000b03","email":"b04-late@example.test","role":"authenticated"}',true);
do $t$ begin
 begin perform public.claim_referral('B04PARTNERCODE');raise exception 'TEST FAIL: expired attribution accepted';
 exception when raise_exception then if SQLERRM<>'Attribution window expired' then raise;end if;end;
end $t$;

-- No beta access: unverified user and anonymous role.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000b06","email":"b04-unverified@example.test","role":"authenticated"}',true);
do $t$ begin
 begin perform public.claim_referral('B04PARTNERCODE');raise exception 'TEST FAIL: unverified claim accepted';
 exception when raise_exception then if SQLERRM<>'Beta access required' then raise;end if;end;
end $t$;
reset role;
set local role anon;
do $t$ begin
 begin perform public.claim_referral('B04PARTNERCODE');raise exception 'TEST FAIL: anon executed claim_referral';
 exception when insufficient_privilege then null;end;
end $t$;
reset role;

-- Partner sees its referral; admin sees all codes.
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000b01","email":"b04-partner@example.test","role":"authenticated"}',true);
do $t$ begin
 if (select count(*) from public.referrals)<>1 then raise exception 'TEST FAIL: partner cannot see its referral';end if;
end $t$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000b05","email":"b04-admin@example.test","role":"authenticated"}',true);
do $t$ begin
 if (select count(*) from public.partner_codes)<>2 then raise exception 'TEST FAIL: admin must see all codes';end if;
end $t$;
reset role;
select 'PASS: B04 private partner codes, single server-side claim, attribution window and actor denials; fixtures rolled back' as verification;
rollback;
