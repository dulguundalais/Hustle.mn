begin;
insert into auth.users(id,email) values
('10000000-0000-4000-8000-000000000001','qa-admin@example.test'),
('10000000-0000-4000-8000-000000000002','qa-seller@example.test'),
('10000000-0000-4000-8000-000000000003','qa-buyer@example.test'),
('10000000-0000-4000-8000-000000000004','qa-other@example.test');
insert into public.beta_allowlist(email,role) values('qa-admin@example.test','admin'),('qa-seller@example.test','member'),('qa-buyer@example.test','member'),('qa-other@example.test','member');
insert into public.profiles(id,display_name,is_seller) values
('10000000-0000-4000-8000-000000000001','QA admin',false),
('10000000-0000-4000-8000-000000000002','QA seller',true),
('10000000-0000-4000-8000-000000000003','QA buyer',false),
('10000000-0000-4000-8000-000000000004','QA other',false);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","email":"qa-seller@example.test","role":"authenticated"}',true);
insert into public.services(id,seller_id,title,description,category,price,delivery_days,status) values('20000000-0000-4000-8000-000000000001',auth.uid(),'QA brand design','A test service with sufficient description.','design',50000,5,'pending');
do $$ begin
 begin update public.services set status='published';raise exception 'TEST FAIL: seller published without moderation';exception when insufficient_privilege then null;end;
 begin update public.profiles set created_at=now()-interval '90 days' where id=auth.uid();raise exception 'TEST FAIL: profile timestamp tampering';exception when raise_exception then if SQLERRM='TEST FAIL: profile timestamp tampering' then raise;end if;end;
 begin perform public.manage_beta('attacker@example.test','admin',true);raise exception 'TEST FAIL: admin escalation';exception when raise_exception then if SQLERRM='TEST FAIL: admin escalation' then raise;end if;end;
end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","email":"qa-admin@example.test","role":"authenticated"}',true);
update public.services set status='published' where id='20000000-0000-4000-8000-000000000001';
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000003","email":"qa-buyer@example.test","role":"authenticated"}',true);
insert into public.orders(id,service_id,buyer_id,seller_id,service_title,quoted_price,brief) values('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',auth.uid(),'10000000-0000-4000-8000-000000000004','forged title',1,'Please create a complete brand identity for this test.');
do $$ begin
 if not exists(select 1 from public.orders where quoted_price=50000 and seller_id='10000000-0000-4000-8000-000000000002' and service_title='QA brand design') then raise exception 'TEST FAIL: order snapshot';end if;
 begin update public.orders set status='completed';raise exception 'TEST FAIL: invalid transition';exception when raise_exception then if SQLERRM='TEST FAIL: invalid transition' then raise;end if;end;
end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000004","email":"qa-other@example.test","role":"authenticated"}',true);
do $$ declare n integer;begin
 select count(*) into n from public.orders;if n<>0 then raise exception 'TEST FAIL: unrelated user read order';end if;
 update public.orders set status='accepted';get diagnostics n=row_count;if n<>0 then raise exception 'TEST FAIL: unrelated user changed order';end if;
end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","email":"qa-seller@example.test","role":"authenticated"}',true);
update public.orders set status='accepted';
update public.orders set status='in_progress';
update public.orders set status='delivered',delivery_note='Completed test deliverables, ready for buyer review.';
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000003","email":"qa-buyer@example.test","role":"authenticated"}',true);
update public.orders set status='completed';
do $$ begin if not exists(select 1 from public.orders where status='completed') then raise exception 'TEST FAIL: completion';end if;end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","email":"qa-admin@example.test","role":"authenticated"}',true);
update public.business_rules set commission_percent=11 where id=true;
do $$ begin if not exists(select 1 from public.audit_events where entity='business_rules') then raise exception 'TEST FAIL: audit';end if;end $$;
insert into public.partner_codes(partner_id,code) values(auth.uid(),'qa-referral');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000003","email":"qa-buyer@example.test","role":"authenticated"}',true);
insert into public.referrals(partner_id,referred_id,eligible_until) values('10000000-0000-4000-8000-000000000001',auth.uid(),now());
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","email":"qa-admin@example.test","role":"authenticated"}',true);
update public.referrals set status='verified';
do $$ begin if not exists(select 1 from public.referrals where status='verified' and eligible_until>now()+interval '11 months') then raise exception 'TEST FAIL: referral eligibility';end if;end $$;
set local role anon;
do $$ begin
 begin perform * from public.orders;raise exception 'TEST FAIL: anonymous read';exception when insufficient_privilege then null;end;
end $$;
reset role;
update public.profiles set slug='qa-seller',public_profile=false where id='10000000-0000-4000-8000-000000000002';
set local role anon;
do $$ begin if public.public_seller('qa-seller') is not null then raise exception 'TEST FAIL: private profile exposed';end if;end $$;
reset role;
update public.profiles set public_profile=true where slug='qa-seller';
set local role anon;
do $$ declare p jsonb;begin p:=public.public_seller('qa-seller');if p is null or p ? 'id' or p ? 'email' or p ? 'orders' or jsonb_array_length(p->'services')<>1 then raise exception 'TEST FAIL: public projection';end if;end $$;
reset role;
update public.beta_allowlist set enabled=false where email='qa-seller@example.test';
set local role anon;
do $$ begin if public.public_seller('qa-seller') is not null then raise exception 'TEST FAIL: disabled seller exposed';end if;end $$;
rollback;
select 'PASS: seller moderation, identity immutability, admin isolation, order snapshot, order lifecycle, unrelated-user denial, audit, referral verification, anonymous denial; all fixtures rolled back' as result;
