-- V17: three seller-authored tiers, protected storage, and server-priced order snapshots.
-- Does not overwrite any pre-existing service or order price.
create table if not exists public.service_packages (
  service_id uuid not null references public.services(id) on delete cascade,
  tier text not null check (tier in ('Basic','Standard','Premium')),
  name text not null check (char_length(trim(name)) between 2 and 60),
  summary text not null default '' check (char_length(summary)<=300),
  price integer not null check (price between 1000 and 100000000),
  delivery_days integer not null check (delivery_days between 1 and 365),
  revisions integer not null check (revisions between 0 and 20),
  includes text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (service_id,tier),
  constraint service_packages_features_check check (
    cardinality(includes) between 1 and 12
    and array_position(includes,null) is null
    and array_length(includes,1) between 1 and 12
  )
);
create index if not exists service_packages_service_idx on public.service_packages(service_id);
alter table public.service_packages enable row level security;
revoke all on public.service_packages from public,anon,authenticated;
grant select,insert,update,delete on public.service_packages to authenticated;

create policy service_packages_read on public.service_packages for select to authenticated
using (
 (select public.beta_role()) is not null and exists (
  select 1 from public.services s where s.id=service_id
    and (s.status='published' or s.seller_id=(select auth.uid())
         or (select public.beta_role())='admin')
 )
);
create policy service_packages_add on public.service_packages for insert to authenticated
with check (
 (select public.beta_role()) is not null and exists (
  select 1 from public.services s where s.id=service_id
   and s.seller_id=(select auth.uid()) and s.status in ('draft','pending')
 )
);
create policy service_packages_edit on public.service_packages for update to authenticated
using (
 (select public.beta_role()) is not null and exists (
  select 1 from public.services s where s.id=service_id
   and s.seller_id=(select auth.uid()) and s.status in ('draft','pending')
 )
)
with check (
 (select public.beta_role()) is not null and exists (
  select 1 from public.services s where s.id=service_id
   and s.seller_id=(select auth.uid()) and s.status in ('draft','pending')
 )
);
create policy service_packages_remove on public.service_packages for delete to authenticated
using (
 (select public.beta_role()) is not null and exists (
  select 1 from public.services s where s.id=service_id
   and s.seller_id=(select auth.uid()) and s.status in ('draft','pending')
 )
);

-- Existing sellers keep their real, stored prices. Do not generate made-up
-- Standard/Premium prices. These remain for sellers to author themselves.
insert into public.service_packages(service_id,tier,name,summary,price,delivery_days,revisions,includes)
select s.id,'Basic','Basic','',s.price,s.delivery_days,s.revisions,array['Үндсэн үйлчилгээ / Base service']
from public.services s
on conflict (service_id,tier) do nothing;

alter table public.orders
 add column if not exists included_features text[] not null default '{}'::text[];

-- A single RPC transaction saves the service and all three packages together.
-- SECURITY INVOKER preserves existing owner/beta RLS on public.services.
create or replace function public.save_service_with_packages(
 p_service_id uuid, p_details jsonb, p_packages jsonb
) returns uuid
language plpgsql security invoker set search_path=''
as $$
declare
 v_user uuid := auth.uid();
 v_role text := public.beta_role();
 v_service uuid;
 v_status text;
 v_tier text;
 v_pkg jsonb;
 v_basic jsonb;
 v_seen text[] := '{}'::text[];
 v_features text[];
 v_title text;
begin
 if v_user is null or v_role is null then raise exception 'Beta access required';end if;
 if not exists(select 1 from public.profiles p where p.id=v_user and p.is_seller) then
  raise exception 'Seller profile required';
 end if;
 if jsonb_typeof(p_details)<>'object' or jsonb_typeof(p_packages)<>'array'
    or jsonb_array_length(p_packages)<>3 then
  raise exception 'Basic, Standard, Premium are all required';
 end if;
 v_status:=p_details->>'status';
 if v_status not in ('draft','pending') or v_status is null then
  raise exception 'Service must be draft or pending review';
 end if;
 for v_pkg in select value from jsonb_array_elements(p_packages) loop
  v_tier:=v_pkg->>'tier';
  if v_tier is null or v_tier not in ('Basic','Standard','Premium')
     or v_tier=any(v_seen) then
   raise exception 'Exactly one of each package tier is required';
  end if;
  v_seen:=array_append(v_seen,v_tier);
  v_features:=array(select jsonb_array_elements_text(v_pkg->'includes'));
  if cardinality(v_features) not between 1 and 12
     or exists(select 1 from unnest(v_features) f where length(trim(f)) not between 1 and 120) then
   raise exception 'Each tier requires 1–12 clear inclusions, max 120 characters each';
  end if;
  if char_length(trim(coalesce(v_pkg->>'name',''))) not between 2 and 60
     or char_length(coalesce(v_pkg->>'summary',''))>300 then
   raise exception 'Package name or summary is invalid';
  end if;
  if (v_pkg->>'price')::integer not between 1000 and 100000000
     or (v_pkg->>'delivery_days')::integer not between 1 and 365
     or (v_pkg->>'revisions')::integer not between 0 and 20 then
   raise exception 'Invalid package price, delivery or revision count';
  end if;
  if v_tier='Basic' then v_basic:=v_pkg;end if;
 end loop;
 if not ('Basic'=any(v_seen) and 'Standard'=any(v_seen) and 'Premium'=any(v_seen)) then
  raise exception 'Basic, Standard and Premium are all required';
 end if;
 if (select (pkg->>'price')::integer from jsonb_array_elements(p_packages) pkg where pkg->>'tier'='Basic') >
    (select (pkg->>'price')::integer from jsonb_array_elements(p_packages) pkg where pkg->>'tier'='Standard')
 or (select (pkg->>'price')::integer from jsonb_array_elements(p_packages) pkg where pkg->>'tier'='Standard') >
    (select (pkg->>'price')::integer from jsonb_array_elements(p_packages) pkg where pkg->>'tier'='Premium')
 then raise exception 'Prices must follow Basic ≤ Standard ≤ Premium';end if;
 if p_service_id is null then
  insert into public.services(seller_id,title,title_en,description,category,
     price,delivery_days,revisions,package_name,status)
   values(v_user,p_details->>'title',coalesce(p_details->>'title_en',''),
     p_details->>'description',p_details->>'category',
     (v_basic->>'price')::integer,(v_basic->>'delivery_days')::integer,
     (v_basic->>'revisions')::integer,'Basic',v_status)
   returning id into v_service;
 else
  if not exists(select 1 from public.services s where s.id=p_service_id
      and s.seller_id=v_user) then raise exception 'Service not owned by this seller';end if;
  update public.services
   set title=p_details->>'title',title_en=coalesce(p_details->>'title_en',''),
     description=p_details->>'description',category=p_details->>'category',
     price=(v_basic->>'price')::integer,delivery_days=(v_basic->>'delivery_days')::integer,
     revisions=(v_basic->>'revisions')::integer,package_name='Basic',status=v_status
   where id=p_service_id returning id into v_service;
  if v_service is null then raise exception 'Service update blocked';end if;
  delete from public.service_packages where service_id=v_service;
 end if;
 for v_pkg in select value from jsonb_array_elements(p_packages) loop
  v_features:=array(select jsonb_array_elements_text(v_pkg->'includes'));
  insert into public.service_packages(service_id,tier,name,summary,price,
      delivery_days,revisions,includes)
  values(v_service,v_pkg->>'tier',trim(v_pkg->>'name'),coalesce(v_pkg->>'summary',''),
    (v_pkg->>'price')::integer,(v_pkg->>'delivery_days')::integer,
    (v_pkg->>'revisions')::integer,v_features);
 end loop;
 return v_service;
end
$$;
revoke all on function public.save_service_with_packages(uuid,jsonb,jsonb) from public,anon;
grant execute on function public.save_service_with_packages(uuid,jsonb,jsonb) to authenticated;

-- Return three public tiers only for publicly opted-in, published sellers.
-- Preserve the existing auth/allowlist/public-profile filters and public RPC wrapper.
create or replace function hustle_private.marketplace_catalog()
returns jsonb language sql stable security definer set search_path=''
as $$
 select coalesce(jsonb_agg(row),'[]'::jsonb) from (
  select s.id,s.title,s.title_en,s.description,s.category,s.price,s.delivery_days,
   s.revisions,s.package_name,p.display_name,p.headline,p.slug,
   (select coalesce(jsonb_agg(jsonb_build_object(
       'tier',k.tier,'name',k.name,'summary',k.summary,'price',k.price,
       'delivery_days',k.delivery_days,'revisions',k.revisions,'includes',k.includes)
       order by case k.tier when 'Basic' then 1 when 'Standard' then 2 else 3 end),'[]'::jsonb)
    from public.service_packages k where k.service_id=s.id) as packages,
   (select i.object_path from public.portfolio_items i where i.seller_id=p.id order by i.created_at desc limit 1) as image_path
  from public.services s
   join public.profiles p on p.id=s.seller_id
   join auth.users u on u.id=p.id
   join public.beta_allowlist a on a.email=lower(u.email)
  where s.status='published' and p.is_seller and p.public_profile
   and p.slug is not null and a.enabled order by s.created_at desc limit 200
 ) row
$$;

-- Order insert MUST price by the selected tier on the server, never by
-- user-supplied quoted_price. Order contents are snapshots for disputes/reviews.
create or replace function hustle_private.order_guard()
returns trigger language plpgsql set search_path=''
as $$
declare
 s public.services;
 pkg public.service_packages;
 tier_selected text;
begin
 if auth.uid() is null or public.beta_role() is null then
  raise exception 'Beta access required';
 end if;
 if TG_OP='INSERT' then
  select * into s from public.services where id=new.service_id and status='published';
  if not found or s.seller_id=auth.uid() then raise exception 'Service unavailable';end if;
  tier_selected:=coalesce(nullif(new.package_name,''),'Basic');
  select * into pkg from public.service_packages
    where service_id=s.id and tier=tier_selected;
  if not found then raise exception 'Selected package is unavailable';end if;
  new.buyer_id=auth.uid();new.seller_id=s.seller_id;new.service_title=s.title;
  new.quoted_price=pkg.price;new.package_name=pkg.tier;
  new.delivery_days=pkg.delivery_days;new.revision_limit=pkg.revisions;
  new.included_features=pkg.includes;
  new.status='requested';new.delivery_note='';new.created_at=now();new.updated_at=now();
  new.revisions_used=0;new.revision_note='';
  return new;
 end if;
 if new.id<>old.id or new.service_id<>old.service_id or new.buyer_id<>old.buyer_id
    or new.seller_id<>old.seller_id or new.service_title<>old.service_title
    or new.quoted_price<>old.quoted_price or new.brief<>old.brief
    or new.created_at<>old.created_at or new.revision_limit<>old.revision_limit
    or new.package_name<>old.package_name or new.delivery_days<>old.delivery_days
    or new.included_features is distinct from old.included_features
 then raise exception 'Immutable order fields';end if;
 new.revisions_used=old.revisions_used;
 if new.status=old.status then raise exception 'Choose a valid next status';end if;
 if auth.uid()=old.seller_id and
   ((old.status='requested' and new.status in ('accepted','rejected'))
    or(old.status='accepted' and new.status='in_progress')
    or(old.status='in_progress' and new.status='delivered')) then
  if new.revision_note<>old.revision_note then raise exception 'Only buyer may request revisions';end if;
  if new.status='delivered' and char_length(trim(new.delivery_note))<10 then
   raise exception 'Delivery note required';end if;
 elsif auth.uid()=old.buyer_id and
   ((old.status='requested' and new.status='cancelled')
     or(old.status='delivered' and new.status in ('completed','in_progress'))) then
  if new.delivery_note<>old.delivery_note then raise exception 'Only seller may edit delivery';end if;
  if new.status='in_progress' then
   if old.revisions_used>=old.revision_limit then raise exception 'Revision limit reached';end if;
   if char_length(trim(new.revision_note))<10 then raise exception 'Describe the requested revision';end if;
   new.revisions_used=old.revisions_used+1;
  elsif new.revision_note<>old.revision_note then
   raise exception 'Revision note is immutable outside revision request';
  end if;
 else raise exception 'Invalid order transition';end if;
 new.updated_at=now();return new;
end
$$;
