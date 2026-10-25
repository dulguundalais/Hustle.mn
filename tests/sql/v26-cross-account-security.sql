-- V26 RLS integration QA. Synthetic identities only; transaction rolls back ALL writes.
begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('10000000-0000-4000-8000-000000000011','v26-admin@example.test',now()),
 ('10000000-0000-4000-8000-000000000012','v26-seller@example.test',now()),
 ('10000000-0000-4000-8000-000000000013','v26-buyer@example.test',now()),
 ('10000000-0000-4000-8000-000000000014','v26-outsider@example.test',now()),
 ('10000000-0000-4000-8000-000000000015','v26-pending@example.test',now());
insert into public.beta_allowlist(email,role,enabled) values
 ('v26-admin@example.test','admin',true),
 ('v26-seller@example.test','member',true),
 ('v26-buyer@example.test','member',true),
 ('v26-outsider@example.test','member',true) on conflict(email) do update set role=excluded.role,enabled=excluded.enabled;
-- Since V46, confirmed emails are auto-enrolled. The admin queue now lists
-- confirmed accounts whose access is disabled, so the pending fixture is disabled.
insert into public.beta_allowlist(email,role,enabled) values('v26-pending@example.test','member',false)
 on conflict(email) do update set enabled=false;
insert into public.profiles(id,display_name,is_seller) values
 ('10000000-0000-4000-8000-000000000011','V26 Admin',false),
 ('10000000-0000-4000-8000-000000000012','V26 Seller',true),
 ('10000000-0000-4000-8000-000000000013','V26 Buyer',false),
 ('10000000-0000-4000-8000-000000000014','V26 Outsider',false);

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000013","email":"v26-buyer@example.test","role":"authenticated"}',true);
insert into public.messages(id,sender_id,recipient_id,body)
values('30000000-0000-4000-8000-000000000011',auth.uid(),'10000000-0000-4000-8000-000000000012','V26 synthetic secure test chat message.');
do $v26$
begin
 if not exists (select 1 from public.messages where id='30000000-0000-4000-8000-000000000011') then raise exception 'TEST FAIL buyer cannot read own chat';end if;
end
$v26$;

-- Storage metadata fixture is inserted as database test administrator and never committed.
reset role;
insert into storage.objects(bucket_id,name,owner_id,metadata)
values('chat-attachments','10000000-0000-4000-8000-000000000013/10000000-0000-4000-8000-000000000012/v26-testing.pdf','10000000-0000-4000-8000-000000000013','{"mimetype":"application/pdf","size":100}');
set local role authenticated;
insert into public.chat_attachments(message_id,sender_id,recipient_id,object_path,file_name,content_type,byte_size)
values('30000000-0000-4000-8000-000000000011',auth.uid(),'10000000-0000-4000-8000-000000000012',
'10000000-0000-4000-8000-000000000013/10000000-0000-4000-8000-000000000012/v26-testing.pdf','v26-testing.pdf','application/pdf',100);
do $v26$
begin
 if (select count(*) from public.chat_attachments where message_id='30000000-0000-4000-8000-000000000011')<>1 then raise exception 'TEST FAIL buyer cannot read own attachment';end if;
 if (select count(*) from storage.objects where name like '%v26-testing.pdf')<>1 then raise exception 'TEST FAIL buyer cannot read owned storage object';end if;
end
$v26$;

select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000012","email":"v26-seller@example.test","role":"authenticated"}',true);
do $v26$ begin
 if (select count(*) from public.messages where id='30000000-0000-4000-8000-000000000011')<>1 then raise exception 'TEST FAIL recipient cannot read chat';end if;
 if (select count(*) from public.chat_attachments where message_id='30000000-0000-4000-8000-000000000011')<>1 then raise exception 'TEST FAIL recipient cannot read file metadata';end if;
 if (select count(*) from storage.objects where name like '%v26-testing.pdf')<>1 then raise exception 'TEST FAIL recipient cannot read private file';end if;
end $v26$;
update public.messages set read_at=now() where id='30000000-0000-4000-8000-000000000011';
do $v26$ begin
 if not exists(select 1 from public.messages where id='30000000-0000-4000-8000-000000000011' and read_at is not null) then raise exception 'TEST FAIL recipient read receipt';end if;
end $v26$;

select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000014","email":"v26-outsider@example.test","role":"authenticated"}',true);
do $v26$ declare n integer; begin
 select count(*) into n from public.messages where id='30000000-0000-4000-8000-000000000011';
 if n<>0 then raise exception 'TEST FAIL outsider read chat';end if;
 select count(*) into n from public.chat_attachments where message_id='30000000-0000-4000-8000-000000000011';
 if n<>0 then raise exception 'TEST FAIL outsider read file metadata';end if;
 select count(*) into n from storage.objects where name like '%v26-testing.pdf';
 if n<>0 then raise exception 'TEST FAIL outsider read private storage';end if;
 begin
  insert into public.messages(sender_id,recipient_id,body) values('10000000-0000-4000-8000-000000000013','10000000-0000-4000-8000-000000000012','Spoofed message');
  raise exception 'TEST FAIL sender impersonation permitted';
 exception when insufficient_privilege or check_violation then null;
 when raise_exception then if SQLERRM='TEST FAIL sender impersonation permitted' then raise;else null;end if;
 end;
 begin
  update public.messages set read_at=now() where id='30000000-0000-4000-8000-000000000011';
  get diagnostics n=row_count;
  if n<>0 then raise exception 'TEST FAIL outsider modified read receipt';end if;
 end;
 begin
  perform * from public.list_pending_beta_signups();
  raise exception 'TEST FAIL non-admin read pending signups';
 exception when insufficient_privilege then null;
 when raise_exception then if SQLERRM='TEST FAIL non-admin read pending signups' then raise;end if;
 end;
end $v26$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000011","email":"v26-admin@example.test","role":"authenticated"}',true);
do $v26$ begin
 if not exists(select 1 from public.list_pending_beta_signups() p where p.email='v26-pending@example.test') then
  raise exception 'TEST FAIL admin pending signup queue';end if;
end $v26$;
rollback;
select 'PASS: Buyer/seller chat, linked attachment, recipient read receipt, outsider message/file/storage denial, spoofing denial and admin-only beta queue. All synthetic changes rolled back.' as result;
