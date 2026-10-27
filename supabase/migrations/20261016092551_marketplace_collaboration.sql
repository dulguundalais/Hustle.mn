-- Additive closed-beta features. Existing records, ownership and public consent remain.
alter table public.profiles add column skills text not null default '' check(char_length(skills)<=500), add column experience text not null default '' check(char_length(experience)<=3000), add column avatar_path text check(avatar_path is null or (split_part(avatar_path,'/',1)=id::text and char_length(avatar_path)<300));
alter table public.services add column revisions integer not null default 2 check(revisions between 0 and 20), add column package_name text not null default 'Basic' check(char_length(package_name) between 1 and 60);
-- A package is a separately priced service listing; each has its own scope and delivery.
alter table public.services drop constraint services_status_check;
alter table public.services add constraint services_status_check check(status in ('draft','pending','published','rejected','paused','archived'));
drop policy services_edit on public.services;
create policy services_edit on public.services for update to authenticated using((select public.beta_role()) is not null and(seller_id=(select auth.uid()) or (select public.beta_role())='admin')) with check((select public.beta_role())='admin' or(seller_id=(select auth.uid()) and status in ('draft','pending','paused','archived')));

create table public.saved_services(user_id uuid not null references public.profiles(id) on delete cascade,service_id uuid not null references public.services(id) on delete cascade,created_at timestamptz not null default now(),primary key(user_id,service_id));
create index saved_service_idx on public.saved_services(service_id);
alter table public.saved_services enable row level security;
grant select,insert,delete on public.saved_services to authenticated;
create policy saved_read on public.saved_services for select to authenticated using(user_id=(select auth.uid()) and (select public.beta_role()) is not null);
create policy saved_add on public.saved_services for insert to authenticated with check(user_id=(select auth.uid()) and (select public.beta_role()) is not null and exists(select 1 from public.services where id=service_id and status='published'));
create policy saved_remove on public.saved_services for delete to authenticated using(user_id=(select auth.uid()) and (select public.beta_role()) is not null);

create table public.messages(id uuid primary key default gen_random_uuid(),sender_id uuid not null references public.profiles(id),recipient_id uuid not null references public.profiles(id),body text not null check(char_length(trim(body)) between 1 and 4000),created_at timestamptz not null default now(),check(sender_id<>recipient_id));
create index messages_sender_idx on public.messages(sender_id,created_at desc);
create index messages_recipient_idx on public.messages(recipient_id,created_at desc);
alter table public.messages enable row level security;
grant select,insert on public.messages to authenticated;
create policy messages_read on public.messages for select to authenticated using((select public.beta_role()) is not null and (sender_id=(select auth.uid()) or recipient_id=(select auth.uid())));
create policy messages_add on public.messages for insert to authenticated with check((select public.beta_role()) is not null and sender_id=(select auth.uid()) and sender_id<>recipient_id);
create function hustle_private.message_stamp() returns trigger language plpgsql security invoker set search_path='' as $$ begin new.created_at=now();return new;end $$;
create trigger message_stamp before insert on public.messages for each row execute function hustle_private.message_stamp();

alter table public.orders add column revision_limit integer not null default 2 check(revision_limit between 0 and 20),add column revisions_used integer not null default 0,add column revision_note text not null default '' check(char_length(revision_note)<=5000),add column package_name text not null default 'Basic',add column delivery_days integer not null default 7;
create or replace function hustle_private.order_guard() returns trigger language plpgsql security invoker set search_path='' as $$ declare s public.services; begin
 if auth.uid() is null or public.beta_role() is null then raise exception 'Beta access required';end if;
 if TG_OP='INSERT' then
 select * into s from public.services where id=new.service_id and status='published';
 if not found or s.seller_id=auth.uid() then raise exception 'Service unavailable';end if;
 new.buyer_id=auth.uid();new.seller_id=s.seller_id;new.service_title=s.title;new.quoted_price=s.price;new.status='requested';new.delivery_note='';new.created_at=now();new.updated_at=now();new.revision_limit=s.revisions;new.revisions_used=0;new.revision_note='';new.package_name=s.package_name;new.delivery_days=s.delivery_days;return new;
 end if;
 if new.id<>old.id or new.service_id<>old.service_id or new.buyer_id<>old.buyer_id or new.seller_id<>old.seller_id or new.service_title<>old.service_title or new.quoted_price<>old.quoted_price or new.brief<>old.brief or new.created_at<>old.created_at or new.revision_limit<>old.revision_limit or new.package_name<>old.package_name or new.delivery_days<>old.delivery_days then raise exception 'Immutable order fields';end if;
 new.revisions_used=old.revisions_used;
 if new.status=old.status then raise exception 'Choose a valid next status';end if;
 if auth.uid()=old.seller_id and ((old.status='requested' and new.status in ('accepted','rejected')) or(old.status='accepted' and new.status='in_progress')or(old.status='in_progress' and new.status='delivered')) then
 if new.revision_note<>old.revision_note then raise exception 'Only buyer may request revisions';end if;
 if new.status='delivered' and char_length(trim(new.delivery_note))<10 then raise exception 'Delivery note required';end if;
 elsif auth.uid()=old.buyer_id and ((old.status='requested' and new.status='cancelled')or(old.status='delivered' and new.status in ('completed','in_progress'))) then
 if new.delivery_note<>old.delivery_note then raise exception 'Only seller may edit delivery';end if;
 if new.status='in_progress' then
 if old.revisions_used>=old.revision_limit then raise exception 'Revision limit reached';end if;
 if char_length(trim(new.revision_note))<10 then raise exception 'Describe the requested revision';end if;
 new.revisions_used=old.revisions_used+1;
 elsif new.revision_note<>old.revision_note then raise exception 'Revision note is immutable outside revision request';end if;
 else raise exception 'Invalid order transition';end if;
 new.updated_at=now();return new;end $$;

create table public.reviews(order_id uuid primary key references public.orders(id),buyer_id uuid not null references public.profiles(id),seller_id uuid not null references public.profiles(id),service_id uuid not null references public.services(id),rating integer not null check(rating between 1 and 5),body text not null check(char_length(trim(body)) between 10 and 2000),created_at timestamptz not null default now());
create index reviews_service_idx on public.reviews(service_id,created_at desc);
create index reviews_seller_idx on public.reviews(seller_id);
create index reviews_buyer_idx on public.reviews(buyer_id);
alter table public.reviews enable row level security;
grant select,insert on public.reviews to authenticated;
create policy reviews_read on public.reviews for select to authenticated using((select public.beta_role()) is not null);
create policy reviews_add on public.reviews for insert to authenticated with check((select public.beta_role()) is not null and buyer_id=(select auth.uid()) and exists(select 1 from public.orders o where o.id=order_id and o.status='completed' and o.buyer_id=auth.uid() and o.seller_id=reviews.seller_id and o.service_id=reviews.service_id));
create trigger review_stamp before insert on public.reviews for each row execute function hustle_private.message_stamp();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('deliverables','deliverables',false,20971520,array['image/jpeg','image/png','image/webp','application/pdf','application/zip','text/plain']);
-- Paths: order UUID / seller UUID / random UUID.ext. Existing order RLS applies too.
create policy deliverables_read on storage.objects for select to authenticated using(bucket_id='deliverables' and (select public.beta_role()) is not null and exists(select 1 from public.orders o where o.id::text=(storage.foldername(name))[1] and (auth.uid()=o.buyer_id or auth.uid()=o.seller_id)));
create policy deliverables_add on storage.objects for insert to authenticated with check(bucket_id='deliverables' and (select public.beta_role()) is not null and (storage.foldername(name))[2]=auth.uid()::text and exists(select 1 from public.orders o where o.id::text=(storage.foldername(name))[1] and o.seller_id=auth.uid() and o.status in ('accepted','in_progress')));
create policy deliverables_remove on storage.objects for delete to authenticated using(bucket_id='deliverables' and (select public.beta_role()) is not null and (storage.foldername(name))[2]=auth.uid()::text and exists(select 1 from public.orders o where o.id::text=(storage.foldername(name))[1] and o.seller_id=auth.uid() and o.status in ('accepted','in_progress')));
revoke all on public.messages,public.saved_services,public.reviews from anon;
