-- V50 professional categories integration QA. Synthetic identities only; the whole
-- transaction rolls back. Run: psql -v ON_ERROR_STOP=1 -f tests/sql/v50-professional-categories.sql
begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('10000000-0000-4000-8000-000000000501','v50-admin@example.test',now()),
 ('10000000-0000-4000-8000-000000000502','v50-lawyer@example.test',now()),
 ('10000000-0000-4000-8000-000000000503','v50-buyer@example.test',now()),
 ('10000000-0000-4000-8000-000000000504','v50-other@example.test',now());
insert into public.beta_allowlist(email,role,enabled) values
 ('v50-admin@example.test','admin',true),('v50-lawyer@example.test','member',true),
 ('v50-buyer@example.test','member',true),('v50-other@example.test','member',true)
 on conflict(email) do update set role=excluded.role,enabled=excluded.enabled;
insert into public.profiles(id,display_name,is_seller,public_profile,slug) values
 ('10000000-0000-4000-8000-000000000501','V50 Admin',false,false,null),
 ('10000000-0000-4000-8000-000000000502','V50 Lawyer',true,true,'v50-lawyer'),
 ('10000000-0000-4000-8000-000000000503','V50 Buyer',false,false,null),
 ('10000000-0000-4000-8000-000000000504','V50 Other',true,true,'v50-other');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000502","email":"v50-lawyer@example.test","role":"authenticated"}',true);
create temp table v50_ids(k text primary key, id uuid) on commit drop;
grant all on v50_ids to authenticated;

-- A seller saves services with subcategory, service model and tags.
do $t$ declare pk jsonb := '[{"tier":"Basic","name":"Basic","summary":"","price":50000,"delivery_days":2,"revisions":1,"includes":["1 hour"]},{"tier":"Standard","name":"Standard","summary":"","price":90000,"delivery_days":3,"revisions":1,"includes":["2 hours"]},{"tier":"Premium","name":"Premium","summary":"","price":150000,"delivery_days":5,"revisions":2,"includes":["4 hours"]}]';
 v uuid; r record;
begin
 v := public.save_service_with_packages(null,'{"title":"AI chatbot setup","description":"A Messenger chatbot that answers customer questions.","category":"ai","subcategory":"chatbots","service_type":"hourly","tags":["chatbot"," messenger ","chatbot"],"status":"pending"}'::jsonb,pk);
 select * into r from public.services where id=v;
 if r.category<>'ai' or r.subcategory<>'chatbots' or r.service_type<>'hourly' or r.tags<>array['chatbot','messenger'] then
  raise exception 'TEST FAIL: new service fields not stored (% % % %)',r.category,r.subcategory,r.service_type,r.tags; end if;
 insert into v50_ids values('ai',v);
 v := public.save_service_with_packages(null,'{"title":"Contract review for startups","description":"Review of service agreements by a licensed lawyer.","category":"legal","subcategory":"contract-review","service_type":"hourly","status":"pending"}'::jsonb,pk);
 insert into v50_ids values('legal',v);
 begin perform public.save_service_with_packages(null,'{"title":"Old style design","description":"Old category ids are no longer accepted here.","category":"design","status":"pending"}'::jsonb,pk);
  raise exception 'TEST FAIL: legacy category accepted';
 exception when check_violation then null; end;
 begin perform public.save_service_with_packages(null,'{"title":"Bad subcategory","description":"Subcategory ids are short lowercase slugs only.","category":"ai","subcategory":"Not A Slug!","status":"pending"}'::jsonb,pk);
  raise exception 'TEST FAIL: invalid subcategory accepted';
 exception when check_violation then null; end;
 begin update public.services set status='published' where id=(select id from v50_ids where k='ai');
  if found then raise exception 'TEST FAIL: seller published own service'; end if;
 exception when insufficient_privilege then null; end;
end $t$;

-- Seller suggestions stay private and pending.
do $t$ declare n integer; begin
 insert into public.category_suggestions(seller_id,parent_category,name_mn,name_en,note)
  values(auth.uid(),'business','  Тендерийн бичиг баримт ','Tender documents','Government tenders');
 if not exists(select 1 from public.category_suggestions where name_mn='Тендерийн бичиг баримт' and status='pending' and reviewed_by is null) then
  raise exception 'TEST FAIL: suggestion not stored as pending'; end if;
 begin update public.category_suggestions set status='approved';
  if found then raise exception 'TEST FAIL: seller approved own suggestion'; end if;
 exception when insufficient_privilege then null; end;
 begin insert into public.category_suggestions(seller_id,name_mn) values('10000000-0000-4000-8000-000000000504','Spoofed');
  raise exception 'TEST FAIL: suggestion on behalf of another seller';
 exception when insufficient_privilege then null; end;
 for n in 1..4 loop insert into public.category_suggestions(seller_id,name_mn) values(auth.uid(),'Санал '||n); end loop;
 begin insert into public.category_suggestions(seller_id,name_mn) values(auth.uid(),'Зургаа дахь санал');
  raise exception 'TEST FAIL: suggestion rate limit';
 exception when raise_exception then if SQLERRM like 'TEST FAIL%' then raise; end if; end;
 begin insert into public.professional_verifications(seller_id,category) values(auth.uid(),'legal');
  raise exception 'TEST FAIL: seller verified self';
 exception when insufficient_privilege then null; end;
end $t$;

select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000504","email":"v50-other@example.test","role":"authenticated"}',true);
do $t$ declare n integer; begin
 select count(*) into n from public.category_suggestions; if n<>0 then raise exception 'TEST FAIL: other seller sees suggestions'; end if;
end $t$;

-- Admin: regulated service needs verification before it can be published.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000501","email":"v50-admin@example.test","role":"authenticated"}',true);
do $t$ declare v uuid := (select id from v50_ids where k='legal'); s record; c jsonb; begin
 begin update public.services set status='published' where id=v;
  raise exception 'TEST FAIL: unverified legal service published';
 exception when raise_exception then if SQLERRM like 'TEST FAIL%' then raise; end if; end;
 insert into public.professional_verifications(seller_id,category,credential_note) values('10000000-0000-4000-8000-000000000502','legal','Bar licence checked');
 if not exists(select 1 from public.professional_verifications where verified_by=auth.uid()) then raise exception 'TEST FAIL: verifier stamp'; end if;
 update public.services set status='published' where id=v;
 c := public.marketplace_catalog();
 if not exists(select 1 from jsonb_array_elements(c) e where e->>'id'=v::text and e->>'subcategory'='contract-review' and e->>'service_type'='hourly') then
  raise exception 'TEST FAIL: verified legal service missing from catalog'; end if;
 update public.professional_verifications set status='revoked' where seller_id='10000000-0000-4000-8000-000000000502';
 c := public.marketplace_catalog();
 if exists(select 1 from jsonb_array_elements(c) e where e->>'id'=v::text) then raise exception 'TEST FAIL: revoked professional still listed'; end if;
 -- Suggestions: merge needs a target, review is stamped.
 select * into s from public.category_suggestions where name_mn='Тендерийн бичиг баримт';
 begin update public.category_suggestions set status='merged' where id=s.id; raise exception 'TEST FAIL: merge without target';
 exception when raise_exception then if SQLERRM like 'TEST FAIL%' then raise; end if; end;
 update public.category_suggestions set status='merged',merged_into='business/proposals',admin_note='Covered by Proposals & tenders' where id=s.id;
 if not exists(select 1 from public.category_suggestions where id=s.id and reviewed_by=auth.uid() and reviewed_at is not null) then raise exception 'TEST FAIL: review stamp'; end if;
 begin update public.category_suggestions set name_mn='edited' where id=s.id; raise exception 'TEST FAIL: admin edited suggestion text';
 exception when insufficient_privilege then null; end;
end $t$;

-- Project requests use the new ids.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000503","email":"v50-buyer@example.test","role":"authenticated"}',true);
do $t$ begin
 perform public.create_project_request('Automate our customer replies','We receive many Messenger questions every day and need help.','ai','business',null,null);
 begin perform public.create_project_request('Old category request','This uses an old category id and must be rejected.','web','business',null,null);
  raise exception 'TEST FAIL: legacy project category accepted';
 exception when raise_exception then if SQLERRM like 'TEST FAIL%' then raise; end if; end;
end $t$;

rollback;
select 'PASS: V50 new service fields, legacy ids rejected, private pending suggestions with rate limit and admin-only review, verified-only regulated publishing and catalog, new project categories. All synthetic changes rolled back.' as result;
