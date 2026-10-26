-- V52 order delivery history + private delivery files. Synthetic identities only;
-- the whole transaction rolls back. Run: psql -v ON_ERROR_STOP=1 -f tests/sql/v52-order-deliveries.sql
begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('10000000-0000-4000-8000-000000000521','v52-admin@example.test',now()),
 ('10000000-0000-4000-8000-000000000522','v52-seller@example.test',now()),
 ('10000000-0000-4000-8000-000000000523','v52-buyer@example.test',now()),
 ('10000000-0000-4000-8000-000000000524','v52-outsider@example.test',now());
insert into public.beta_allowlist(email,role,enabled) values
 ('v52-admin@example.test','admin',true),('v52-seller@example.test','member',true),
 ('v52-buyer@example.test','member',true),('v52-outsider@example.test','member',true)
 on conflict(email) do update set role=excluded.role,enabled=excluded.enabled;
insert into public.profiles(id,display_name,is_seller) values
 ('10000000-0000-4000-8000-000000000521','V52 Admin',false),
 ('10000000-0000-4000-8000-000000000522','V52 Seller',true),
 ('10000000-0000-4000-8000-000000000523','V52 Buyer',false),
 ('10000000-0000-4000-8000-000000000524','V52 Outsider',false);
-- A published service with one revision, created as the platform owner for brevity.
insert into public.services(id,seller_id,title,description,category,price,delivery_days,status) values
 ('20000000-0000-4000-8000-000000000521','10000000-0000-4000-8000-000000000522','V52 brand design','A test service with sufficient description.','creative',50000,5,'published');
insert into public.service_packages(service_id,tier,name,summary,price,delivery_days,revisions,includes) values
 ('20000000-0000-4000-8000-000000000521','Basic','V52 Basic','Rollback tier',50000,5,1,array['Logo']);

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000523","email":"v52-buyer@example.test","role":"authenticated"}',true);
insert into public.orders(id,service_id,buyer_id,seller_id,service_title,quoted_price,brief) values
 ('30000000-0000-4000-8000-000000000521','20000000-0000-4000-8000-000000000521',auth.uid(),'10000000-0000-4000-8000-000000000522','x',1,'Please create a complete brand identity for this test.');

select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000522","email":"v52-seller@example.test","role":"authenticated"}',true);
update public.orders set status='accepted';
-- Files cannot be added before work starts.
do $t$ begin
 begin insert into storage.objects(bucket_id,name,owner_id) values('order-files','30000000-0000-4000-8000-000000000521/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.pdf',auth.uid()::text);
  raise exception 'TEST FAIL: upload before in_progress';
 exception when insufficient_privilege then null; end;
end $t$;
update public.orders set status='in_progress';
insert into storage.objects(bucket_id,name,owner_id) values
 ('order-files','30000000-0000-4000-8000-000000000521/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.pdf',auth.uid()::text);
insert into public.order_files(order_id,uploader_id,round,object_path,file_name,content_type,byte_size) values
 ('30000000-0000-4000-8000-000000000521','10000000-0000-4000-8000-000000000523',7,'30000000-0000-4000-8000-000000000521/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.pdf','brand-guide.pdf','application/pdf',1200);
do $t$ begin
 if not exists(select 1 from public.order_files where uploader_id=auth.uid() and round=0) then raise exception 'TEST FAIL: server must set uploader and round'; end if;
 -- A row must point at an object this seller really uploaded for this order.
 begin insert into public.order_files(order_id,uploader_id,object_path,file_name,content_type,byte_size) values
  ('30000000-0000-4000-8000-000000000521',auth.uid(),'30000000-0000-4000-8000-000000000521/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.pdf','ghost.pdf','application/pdf',10);
  raise exception 'TEST FAIL: row without a stored object';
 exception when raise_exception then if SQLERRM like 'TEST FAIL%' then raise; end if; end;
 -- Uploads into another order's folder are refused by storage policy.
 begin insert into storage.objects(bucket_id,name,owner_id) values('order-files','30000000-0000-4000-8000-000000000999/cccccccc-cccc-4ccc-8ccc-cccccccccccc.pdf',auth.uid()::text);
  raise exception 'TEST FAIL: upload into a foreign order folder';
 exception when insufficient_privilege then null; end;
end $t$;
update public.orders set status='delivered',delivery_note='First version of the brand guide is attached.';

-- Buyer sees the history and the file; asks for one revision (the only one allowed).
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000523","email":"v52-buyer@example.test","role":"authenticated"}',true);
do $t$ declare n integer; begin
 select count(*) into n from public.order_events where kind='delivered'; if n<>1 then raise exception 'TEST FAIL: buyer should see one delivery, saw %',n; end if;
 select count(*) into n from public.order_files; if n<>1 then raise exception 'TEST FAIL: buyer should see the file'; end if;
 select count(*) into n from storage.objects where bucket_id='order-files'; if n<>1 then raise exception 'TEST FAIL: buyer should read the stored file'; end if;
 begin insert into public.order_events(order_id,actor_id,kind,round) values('30000000-0000-4000-8000-000000000521',auth.uid(),'delivered',0);
  raise exception 'TEST FAIL: clients must not write history';
 exception when insufficient_privilege then null; end;
 delete from public.order_files; get diagnostics n=row_count; if n<>0 then raise exception 'TEST FAIL: buyer removed a deliverable'; end if;
end $t$;
update public.orders set status='in_progress',revision_note='Please use a darker blue in the logo.';

-- Outsider sees nothing.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000524","email":"v52-outsider@example.test","role":"authenticated"}',true);
do $t$ declare n integer; begin
 select count(*) into n from public.order_events; if n<>0 then raise exception 'TEST FAIL: outsider read history'; end if;
 select count(*) into n from public.order_files; if n<>0 then raise exception 'TEST FAIL: outsider read files'; end if;
 select count(*) into n from storage.objects where bucket_id='order-files'; if n<>0 then raise exception 'TEST FAIL: outsider read stored file'; end if;
end $t$;

-- Seller delivers the revision with a second file; earlier round stays intact.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000522","email":"v52-seller@example.test","role":"authenticated"}',true);
do $t$ declare n integer; begin
 delete from public.order_files where round=0; get diagnostics n=row_count; if n<>0 then raise exception 'TEST FAIL: earlier delivery files must be kept'; end if;
end $t$;
insert into storage.objects(bucket_id,name,owner_id) values
 ('order-files','30000000-0000-4000-8000-000000000521/dddddddd-dddd-4ddd-8ddd-dddddddddddd.png',auth.uid()::text);
insert into public.order_files(order_id,uploader_id,object_path,file_name,content_type,byte_size) values
 ('30000000-0000-4000-8000-000000000521',auth.uid(),'30000000-0000-4000-8000-000000000521/dddddddd-dddd-4ddd-8ddd-dddddddddddd.png','logo-v2.png','image/png',900);
update public.orders set status='delivered',delivery_note='Second version with the darker blue.';

select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000523","email":"v52-buyer@example.test","role":"authenticated"}',true);
do $t$ declare n integer; begin
 select count(*) into n from public.order_events; if n<>3 then raise exception 'TEST FAIL: expected deliver, revision, deliver; saw %',n; end if;
 if not exists(select 1 from public.order_events where kind='revision_requested' and round=1 and note like '%darker blue%') then raise exception 'TEST FAIL: revision note kept'; end if;
 if (select count(distinct round) from public.order_files)<>2 then raise exception 'TEST FAIL: files per round'; end if;
 -- The package allowed one revision; a second request is refused by the server.
 begin update public.orders set status='in_progress',revision_note='One more change please, thanks.';
  raise exception 'TEST FAIL: revision limit not enforced';
 exception when raise_exception then if SQLERRM like 'TEST FAIL%' then raise; end if; end;
end $t$;
update public.orders set status='completed';

-- Admin can review the history.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000521","email":"v52-admin@example.test","role":"authenticated"}',true);
do $t$ begin if (select count(*) from public.order_events)<3 then raise exception 'TEST FAIL: admin history'; end if; end $t$;
select 'v52 order deliveries: PASS';
rollback;
