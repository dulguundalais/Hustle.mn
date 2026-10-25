create schema if not exists hustle_private;
revoke all on schema hustle_private from public, anon;
grant usage on schema hustle_private to authenticated;
create table public.beta_allowlist (
 email text primary key check(email=lower(email) and position('@' in email)>1),
 enabled boolean not null default true,
 role text not null default 'member' check(role in ('member','partner','admin')),
 created_at timestamptz not null default now()
);
alter table public.beta_allowlist enable row level security;
revoke all on public.beta_allowlist from anon,authenticated;
grant select on public.beta_allowlist to authenticated;
create policy beta_self on public.beta_allowlist for select to authenticated using(email=lower((select auth.jwt()->>'email')));
create function public.beta_role() returns text language sql stable security invoker set search_path='' as $$ select role from public.beta_allowlist where email=lower(auth.jwt()->>'email') and enabled $$;
revoke all on function public.beta_role() from public,anon;
grant execute on function public.beta_role() to authenticated;
create table public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(char_length(display_name) between 2 and 80),
 headline text not null default '' check(char_length(headline)<=150),
 bio text not null default '' check(char_length(bio)<=3000),
 is_seller boolean not null default false,
 slug text unique check(slug ~ '^[a-z0-9][a-z0-9-]{2,59}$'),
 public_profile boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
grant select,insert,update on public.profiles to authenticated;
create policy profiles_read on public.profiles for select to authenticated using((select public.beta_role()) is not null);
create policy profiles_insert on public.profiles for insert to authenticated with check(id=(select auth.uid()) and (select public.beta_role()) is not null);
create policy profiles_edit on public.profiles for update to authenticated using(id=(select auth.uid()) and (select public.beta_role()) is not null) with check(id=(select auth.uid()) and (select public.beta_role()) is not null);
create table public.services(
 id uuid primary key default gen_random_uuid(),seller_id uuid not null references public.profiles(id),
 title text not null check(char_length(title) between 5 and 120),
 title_en text not null default '' check(char_length(title_en)<=120),
 description text not null check(char_length(description) between 20 and 5000),
 category text not null check(category in ('design','ui','video','translation','marketing','web','interior','ai','proposals')),
 price integer not null check(price between 1000 and 100000000),
 delivery_days integer not null check(delivery_days between 1 and 365),
 status text not null default 'draft' check(status in ('draft','pending','published','rejected')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index services_seller_idx on public.services(seller_id);
create index services_discovery_idx on public.services(status,category,price);
alter table public.services enable row level security;
grant select,insert,update on public.services to authenticated;
create policy services_read on public.services for select to authenticated using((select public.beta_role()) is not null and(status='published' or seller_id=(select auth.uid()) or (select public.beta_role())='admin'));
create policy services_insert on public.services for insert to authenticated with check((select public.beta_role()) is not null and seller_id=(select auth.uid()) and status in ('draft','pending') and exists(select 1 from public.profiles where id=auth.uid() and is_seller));
create policy services_edit on public.services for update to authenticated using((select public.beta_role()) is not null and(seller_id=(select auth.uid()) or (select public.beta_role())='admin')) with check((select public.beta_role())='admin' or(seller_id=(select auth.uid()) and status in ('draft','pending')));
create function hustle_private.service_guard() returns trigger language plpgsql security invoker set search_path='' as $$ begin
 if new.id<>old.id or new.seller_id<>old.seller_id or new.created_at<>old.created_at then raise exception 'Immutable service ownership';end if;
 new.updated_at=now();return new;end $$;
create trigger service_guard before update on public.services for each row execute function hustle_private.service_guard();
create table public.orders(
 id uuid primary key default gen_random_uuid(),service_id uuid not null references public.services(id),
 buyer_id uuid not null references public.profiles(id),seller_id uuid not null references public.profiles(id),
 service_title text not null,quoted_price integer not null,
 brief text not null check(char_length(brief) between 20 and 5000),
 status text not null default 'requested' check(status in ('requested','accepted','in_progress','delivered','completed','rejected','cancelled')),
 delivery_note text not null default '' check(char_length(delivery_note)<=5000),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(buyer_id<>seller_id)
);
create index orders_buyer_idx on public.orders(buyer_id,created_at desc);
create index orders_seller_idx on public.orders(seller_id,created_at desc);
create index orders_service_idx on public.orders(service_id);
alter table public.orders enable row level security;
grant select,insert,update on public.orders to authenticated;
create policy orders_read on public.orders for select to authenticated using((select public.beta_role()) is not null and(buyer_id=(select auth.uid()) or seller_id=(select auth.uid()) or (select public.beta_role())='admin'));
create policy orders_insert on public.orders for insert to authenticated with check((select public.beta_role()) is not null and buyer_id=(select auth.uid()) and status='requested' and seller_id<>auth.uid());
create policy orders_edit on public.orders for update to authenticated using((select public.beta_role()) is not null and(buyer_id=(select auth.uid()) or seller_id=(select auth.uid()))) with check((select public.beta_role()) is not null and(buyer_id=(select auth.uid()) or seller_id=(select auth.uid())));
create function hustle_private.order_guard() returns trigger language plpgsql security invoker set search_path='' as $$ declare s public.services; begin
 if auth.uid() is null or public.beta_role() is null then raise exception 'Beta access required';end if;
 if TG_OP='INSERT' then
 select * into s from public.services where id=new.service_id and status='published';
 if not found or s.seller_id=auth.uid() then raise exception 'Service unavailable';end if;
 new.buyer_id=auth.uid();new.seller_id=s.seller_id;new.service_title=s.title;new.quoted_price=s.price;new.status='requested';new.delivery_note='';new.created_at=now();new.updated_at=now();return new;
 end if;
 if new.id<>old.id or new.service_id<>old.service_id or new.buyer_id<>old.buyer_id or new.seller_id<>old.seller_id or new.service_title<>old.service_title or new.quoted_price<>old.quoted_price or new.brief<>old.brief or new.created_at<>old.created_at then raise exception 'Immutable order fields';end if;
 if new.status=old.status then raise exception 'Choose a valid next status';end if;
 if auth.uid()=old.seller_id and ((old.status='requested' and new.status in ('accepted','rejected')) or(old.status='accepted' and new.status='in_progress')or(old.status='in_progress' and new.status='delivered')) then
 if new.status='delivered' and char_length(trim(new.delivery_note))<10 then raise exception 'Delivery note required';end if;
 elsif auth.uid()=old.buyer_id and ((old.status='requested' and new.status='cancelled')or(old.status='delivered' and new.status='completed')) then
 if new.delivery_note<>old.delivery_note then raise exception 'Only seller may edit delivery';end if;
 else raise exception 'Invalid order transition';end if;
 new.updated_at=now();return new;end $$;
create trigger order_guard before insert or update on public.orders for each row execute function hustle_private.order_guard();
create table public.portfolio_items(
 id uuid primary key default gen_random_uuid(),seller_id uuid not null references public.profiles(id),
 title text not null check(char_length(title) between 2 and 120),
 object_path text not null check(char_length(object_path)<300),
 created_at timestamptz not null default now()
);
create index portfolio_seller_idx on public.portfolio_items(seller_id);
alter table public.portfolio_items enable row level security;
grant select,insert,delete on public.portfolio_items to authenticated;
create policy portfolio_read on public.portfolio_items for select to authenticated using((select public.beta_role()) is not null);
create policy portfolio_add on public.portfolio_items for insert to authenticated with check((select public.beta_role()) is not null and seller_id=auth.uid() and split_part(object_path,'/',1)=auth.uid()::text);
create policy portfolio_remove on public.portfolio_items for delete to authenticated using((select public.beta_role()) is not null and seller_id=auth.uid());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('portfolio','portfolio',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy portfolio_objects_read on storage.objects for select to authenticated using(bucket_id='portfolio' and (select public.beta_role()) is not null);
create policy portfolio_objects_add on storage.objects for insert to authenticated with check(bucket_id='portfolio' and (select public.beta_role()) is not null and (storage.foldername(name))[1]=auth.uid()::text);
create policy portfolio_objects_remove on storage.objects for delete to authenticated using(bucket_id='portfolio' and (select public.beta_role()) is not null and (storage.foldername(name))[1]=auth.uid()::text);
create table public.business_rules(
 id boolean primary key default true check(id),commission_percent numeric(5,2) not null default 10 check(commission_percent between 0 and 100),
 partner_percent numeric(5,2) not null default 1 check(partner_percent between 0 and 100),
 active_partner_percent numeric(5,2) not null default 2 check(active_partner_percent between 0 and 100),
 attribution_days integer not null default 30 check(attribution_days between 1 and 365),
 reward_months integer not null default 12 check(reward_months between 1 and 60)
);
insert into public.business_rules(id) values(true);
alter table public.business_rules enable row level security;
grant select,update on public.business_rules to authenticated;
create policy rules_read on public.business_rules for select to authenticated using((select public.beta_role()) is not null);
create policy rules_admin on public.business_rules for update to authenticated using((select public.beta_role())='admin') with check((select public.beta_role())='admin');
create table public.partner_codes(
 partner_id uuid primary key references public.profiles(id),code text not null unique default replace(gen_random_uuid()::text,'-',''),created_at timestamptz not null default now()
);
alter table public.partner_codes enable row level security;
grant select,insert on public.partner_codes to authenticated;
create policy codes_read on public.partner_codes for select to authenticated using((select public.beta_role()) is not null);
create policy codes_create on public.partner_codes for insert to authenticated with check(partner_id=auth.uid() and (select public.beta_role()) in ('partner','admin'));
create table public.referrals(
 id uuid primary key default gen_random_uuid(),partner_id uuid not null references public.partner_codes(partner_id),referred_id uuid not null unique references public.profiles(id),
 status text not null default 'pending' check(status in ('pending','verified','rejected')),
 created_at timestamptz not null default now(),eligible_until timestamptz not null,
 reviewed_at timestamptz,check(partner_id<>referred_id)
);
create index referrals_partner_idx on public.referrals(partner_id);
alter table public.referrals enable row level security;
grant select,insert,update on public.referrals to authenticated;
create policy referrals_read on public.referrals for select to authenticated using((select public.beta_role()) is not null and(partner_id=auth.uid() or referred_id=auth.uid() or (select public.beta_role())='admin'));
create policy referrals_add on public.referrals for insert to authenticated with check((select public.beta_role()) is not null and referred_id=auth.uid() and partner_id<>auth.uid() and status='pending');
create policy referrals_admin on public.referrals for update to authenticated using((select public.beta_role())='admin') with check((select public.beta_role())='admin');
create function hustle_private.referral_guard() returns trigger language plpgsql security invoker set search_path='' as $$ declare r public.business_rules;joined timestamptz;begin
 if TG_OP='INSERT' then
 select * into r from public.business_rules where id=true;select created_at into joined from public.profiles where id=auth.uid();
 if joined is null or now()>joined+make_interval(days=>r.attribution_days) then raise exception 'Attribution window expired';end if;
 new.created_at=now();new.eligible_until=now()+make_interval(months=>r.reward_months);new.reviewed_at=null;new.status='pending';
 else
 if new.id<>old.id or new.partner_id<>old.partner_id or new.referred_id<>old.referred_id or new.created_at<>old.created_at or new.eligible_until<>old.eligible_until then raise exception 'Immutable referral attribution';end if;
 if old.status<>'pending' or new.status not in ('verified','rejected') then raise exception 'Referral already reviewed';end if;new.reviewed_at=now();end if;return new;end $$;
create trigger referral_guard before insert or update on public.referrals for each row execute function hustle_private.referral_guard();
create table public.audit_events(id bigint generated always as identity primary key,actor_id uuid,entity text not null,record_id text,action text not null,created_at timestamptz not null default now());
alter table public.audit_events enable row level security;
grant select on public.audit_events to authenticated;
create policy audit_admin on public.audit_events for select to authenticated using((select public.beta_role())='admin');
create function hustle_private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null then return new;end if;
 insert into public.audit_events(actor_id,entity,record_id,action) values(auth.uid(),TG_TABLE_NAME,to_jsonb(new)->>'id',TG_OP);return new;end $$;
revoke all on function hustle_private.audit_change() from public,anon,authenticated;
create trigger audit_services after insert or update on public.services for each row execute function hustle_private.audit_change();
create trigger audit_orders after insert or update on public.orders for each row execute function hustle_private.audit_change();
create trigger audit_rules after update on public.business_rules for each row execute function hustle_private.audit_change();
create trigger audit_referrals after insert or update on public.referrals for each row execute function hustle_private.audit_change();
-- Explicit, checked admin endpoints. Definer lives in a non-exposed schema.
create function hustle_private.manage_beta(target_email text,target_role text,target_enabled boolean) returns void language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null or not exists(select 1 from public.beta_allowlist where email=lower(auth.jwt()->>'email') and enabled and role='admin') then raise exception 'Admin only';end if;
 if lower(target_email)=lower(auth.jwt()->>'email') then raise exception 'Cannot change own administrator access';end if;
 insert into public.beta_allowlist(email,role,enabled) values(lower(trim(target_email)),target_role,target_enabled) on conflict(email) do update set role=excluded.role,enabled=excluded.enabled;
 insert into public.audit_events(actor_id,entity,action) values(auth.uid(),'beta_allowlist','UPDATE');end $$;
revoke all on function hustle_private.manage_beta(text,text,boolean) from public,anon;
grant execute on function hustle_private.manage_beta(text,text,boolean) to authenticated;
create function public.manage_beta(target_email text,target_role text,target_enabled boolean) returns void language sql security invoker set search_path='' as $$ select hustle_private.manage_beta(target_email,target_role,target_enabled) $$;
revoke all on function public.manage_beta(text,text,boolean) from public,anon;
grant execute on function public.manage_beta(text,text,boolean) to authenticated;
create function hustle_private.list_beta() returns setof public.beta_allowlist language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null or not exists(select 1 from public.beta_allowlist where email=lower(auth.jwt()->>'email') and enabled and role='admin') then raise exception 'Admin only';end if;
 return query select * from public.beta_allowlist order by created_at desc;end $$;
revoke all on function hustle_private.list_beta() from public,anon;
grant execute on function hustle_private.list_beta() to authenticated;
create function public.list_beta() returns setof public.beta_allowlist language sql security invoker set search_path='' as $$ select * from hustle_private.list_beta() $$;
revoke all on function public.list_beta() from public,anon;
grant execute on function public.list_beta() to authenticated;
-- No anonymous data grants: live beta records stay private. Public sharing can be enabled separately.
revoke all on public.profiles,public.services,public.orders,public.portfolio_items,public.business_rules,public.partner_codes,public.referrals,public.audit_events from anon;

create function hustle_private.profile_guard() returns trigger language plpgsql security invoker set search_path='' as $$ begin
 if TG_OP='INSERT' then new.created_at=now();
 elsif new.id<>old.id or new.created_at<>old.created_at then raise exception 'Immutable profile identity';end if;return new;end $$;
create trigger profile_guard before insert or update on public.profiles for each row execute function hustle_private.profile_guard();
