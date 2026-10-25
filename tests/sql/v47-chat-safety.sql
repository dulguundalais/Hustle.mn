-- V47 chat safety integration QA. Synthetic identities only; the whole
-- transaction rolls back. Run: psql -v ON_ERROR_STOP=1 -f tests/sql/v47-chat-safety.sql
begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('10000000-0000-4000-8000-000000000071','v47-admin@example.test',now()),
 ('10000000-0000-4000-8000-000000000072','v47-seller@example.test',now()),
 ('10000000-0000-4000-8000-000000000073','v47-buyer@example.test',now()),
 ('10000000-0000-4000-8000-000000000074','v47-spammer@example.test',now());
insert into public.beta_allowlist(email,role,enabled) values
 ('v47-admin@example.test','admin',true),('v47-seller@example.test','member',true),
 ('v47-buyer@example.test','member',true),('v47-spammer@example.test','member',true)
 on conflict(email) do update set role=excluded.role,enabled=excluded.enabled;
insert into public.profiles(id,display_name,is_seller) values
 ('10000000-0000-4000-8000-000000000071','V47 Admin',false),
 ('10000000-0000-4000-8000-000000000072','V47 Seller',true),
 ('10000000-0000-4000-8000-000000000073','V47 Buyer',false),
 ('10000000-0000-4000-8000-000000000074','V47 Spammer',false);
-- 25 synthetic people for the new-conversation limit.
insert into auth.users(id,email,email_confirmed_at)
 select ('20000000-0000-4000-8000-0000000000'||lpad(g::text,2,'0'))::uuid,'v47-p'||g||'@example.test',now() from generate_series(10,34) g;
insert into public.profiles(id,display_name)
 select ('20000000-0000-4000-8000-0000000000'||lpad(g::text,2,'0'))::uuid,'V47 Person '||g from generate_series(10,34) g;

set local role authenticated;

-- Buyer messages seller; seller replies.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000073","email":"v47-buyer@example.test","role":"authenticated"}',true);
insert into public.messages(id,sender_id,recipient_id,body) values
 ('30000000-0000-4000-8000-000000000071',auth.uid(),'10000000-0000-4000-8000-000000000072','Hello, is the logo package available?');

-- Seller blocks buyer; the buyer cannot see the block and cannot message.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000072","email":"v47-seller@example.test","role":"authenticated"}',true);
insert into public.user_blocks(blocker_id,blocked_id) values(auth.uid(),'10000000-0000-4000-8000-000000000073');
do $t$ begin
 begin insert into public.user_blocks(blocker_id,blocked_id) values('10000000-0000-4000-8000-000000000073','10000000-0000-4000-8000-000000000074');
  raise exception 'TEST FAIL: block on behalf of another user';
 exception when insufficient_privilege then null; end;
 begin insert into public.messages(sender_id,recipient_id,body) values(auth.uid(),'10000000-0000-4000-8000-000000000073','Reply after blocking');
  raise exception 'TEST FAIL: blocker could message blocked user';
 exception when raise_exception then if SQLERRM like 'TEST FAIL%' then raise; end if; end;
end $t$;

select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000073","email":"v47-buyer@example.test","role":"authenticated"}',true);
do $t$ declare n integer; begin
 select count(*) into n from public.user_blocks; if n<>0 then raise exception 'TEST FAIL: blocked user can see block rows'; end if;
 begin insert into public.messages(sender_id,recipient_id,body) values(auth.uid(),'10000000-0000-4000-8000-000000000072','Are you there?');
  raise exception 'TEST FAIL: blocked user could message blocker';
 exception when raise_exception then if SQLERRM like 'TEST FAIL%' then raise; end if; end;
 select count(*) into n from public.messages where id='30000000-0000-4000-8000-000000000071';
 if n<>1 then raise exception 'TEST FAIL: history hidden after block'; end if;
end $t$;

-- Seller unblocks; conversation works again.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000072","email":"v47-seller@example.test","role":"authenticated"}',true);
delete from public.user_blocks where blocked_id='10000000-0000-4000-8000-000000000073';
insert into public.messages(sender_id,recipient_id,body) values(auth.uid(),'10000000-0000-4000-8000-000000000073','Yes, it is available.');

-- Seller reports the buyer's message; cannot report someone else's message or fake status.
do $t$ begin
 insert into public.message_reports(reporter_id,reported_id,message_id,reason,details)
  values(auth.uid(),'10000000-0000-4000-8000-000000000073','30000000-0000-4000-8000-000000000071','spam','  test report  ');
 if not exists(select 1 from public.message_reports where details='test report' and status='open' and reviewed_by is null) then
  raise exception 'TEST FAIL: report not stored as open'; end if;
 begin insert into public.message_reports(reporter_id,reported_id,message_id,reason)
  values(auth.uid(),'10000000-0000-4000-8000-000000000074','30000000-0000-4000-8000-000000000071','scam');
  raise exception 'TEST FAIL: reported a message the accused did not send';
 exception when insufficient_privilege then null; end;
 begin insert into public.message_reports(reporter_id,reported_id,message_id,reason)
  values(auth.uid(),'10000000-0000-4000-8000-000000000073','30000000-0000-4000-8000-000000000071','spam');
  raise exception 'TEST FAIL: duplicate open report';
 exception when unique_violation then null; end;
 begin update public.message_reports set status='dismissed';
  if found then raise exception 'TEST FAIL: reporter changed report status'; end if;
 exception when insufficient_privilege then null; end;
 begin perform * from public.admin_message_reports('all'); raise exception 'TEST FAIL: non-admin read queue';
 exception when insufficient_privilege then null; end;
end $t$;

-- The reported buyer cannot see the report.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000073","email":"v47-buyer@example.test","role":"authenticated"}',true);
do $t$ declare n integer; begin
 select count(*) into n from public.message_reports; if n<>0 then raise exception 'TEST FAIL: reported user sees report'; end if;
end $t$;

-- Admin reviews the queue and resolves the report.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000071","email":"v47-admin@example.test","role":"authenticated"}',true);
do $t$ declare q record; begin
 select * into q from public.admin_message_reports('open') limit 1;
 if q.reported_email<>'v47-buyer@example.test' or q.message_body not like 'Hello%' or q.reported_open_reports<>1 then
  raise exception 'TEST FAIL: admin queue content'; end if;
 update public.message_reports set status='dismissed',admin_note='Not spam' where id=q.id;
 if not exists(select 1 from public.message_reports where id=q.id and reviewed_by=auth.uid() and reviewed_at is not null) then
  raise exception 'TEST FAIL: review stamp'; end if;
 begin update public.message_reports set details='edited' where id=q.id; raise exception 'TEST FAIL: admin edited report details';
 exception when insufficient_privilege then null; end;
end $t$;

-- Rate limits: burst limit and new-conversation limit.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000074","email":"v47-spammer@example.test","role":"authenticated"}',true);
do $t$ declare i integer; begin
 for i in 10..29 loop
  begin
   insert into public.messages(sender_id,recipient_id,body)
    values(auth.uid(),('20000000-0000-4000-8000-0000000000'||lpad(i::text,2,'0'))::uuid,'Cold message '||i);
  exception when raise_exception then
   if SQLERRM not like 'You are sending messages too quickly%' then raise; end if;
  end;
 end loop;
end $t$;
do $t$ declare n integer; begin
 select count(*) into n from public.messages where sender_id=auth.uid();
 if n<>15 then raise exception 'TEST FAIL: burst limit allowed % messages', n; end if;
end $t$;
-- Age those messages past the burst window to test the new-conversation limit alone.
reset role;
set local session_replication_role = replica; -- fixture only: bypass the immutability trigger
update public.messages set created_at=now()-interval '2 hours' where sender_id='10000000-0000-4000-8000-000000000074';
set local session_replication_role = origin;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000074","email":"v47-spammer@example.test","role":"authenticated"}',true);
do $t$ declare i integer; n integer; begin
 for i in 25..34 loop
  begin
   insert into public.messages(sender_id,recipient_id,body) values(auth.uid(),('20000000-0000-4000-8000-0000000000'||lpad(i::text,2,'0'))::uuid,'Cold message '||i);
  exception when raise_exception then
   if SQLERRM not like 'You have started many new conversations%' then raise; end if;
  end;
 end loop;
 select count(distinct recipient_id) into n from public.messages where sender_id=auth.uid();
 if n<>20 then raise exception 'TEST FAIL: new-conversation limit allowed % recipients', n; end if;
 -- Replying inside an existing conversation is still allowed.
 insert into public.messages(sender_id,recipient_id,body) values(auth.uid(),'20000000-0000-4000-8000-000000000010','Follow-up in an existing thread');
end $t$;

rollback;
select 'PASS: V47 blocks (both directions, private), reports (scoped, deduplicated, immutable, admin-only review), burst and new-conversation limits. All synthetic changes rolled back.' as result;
