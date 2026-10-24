-- V41: seller-owned profile photos re-use the existing PRIVATE 'portfolio' bucket.
-- No public bucket, no new account system and no production deployment.
begin;

-- Prevent a seller from claiming another person's private storage object as an avatar.
do $v41$
begin
 if not exists(select 1 from pg_constraint where conname='profiles_avatar_owner_path' and conrelid='public.profiles'::regclass) then
  alter table public.profiles add constraint profiles_avatar_owner_path check (
   avatar_path is null or avatar_path ~ ('^'||id::text||'/[a-f0-9-]{36}\\.(jpg|png|webp)$')
  );
 end if;
end $v41$;

-- The RLS helper grants read only for the *current* saved avatar of an explicitly
-- published/approved seller. Superseded and draft objects remain private.
create or replace function hustle_private.public_avatar_image(object_name text)
returns boolean language sql stable security definer set search_path='' as $v41$
 select exists (
  select 1 from public.profiles p
  join auth.users u on u.id=p.id
  join public.beta_allowlist a on a.email=lower(u.email)
  where p.avatar_path=object_name and p.public_profile and p.is_seller and a.enabled
 )
$v41$;
revoke all on function hustle_private.public_avatar_image(text) from public;
grant execute on function hustle_private.public_avatar_image(text) to anon,authenticated;
drop policy if exists public_seller_avatar_images on storage.objects;
create policy public_seller_avatar_images on storage.objects for select to anon
 using(bucket_id='portfolio' and hustle_private.public_avatar_image(name));

-- Keep V40's public seller shape intact. Only project the same seller-owned
-- avatar_path alongside skills, portfolio, approved services and selected tools.
create or replace function hustle_private.public_seller(profile_slug text)
returns jsonb language sql stable security definer set search_path='' as $v41$
 select jsonb_build_object(
 'display_name',p.display_name,
 'headline',p.headline,
 'bio',p.bio,
 'skills',p.skills,
 'slug',p.slug,
 'avatar_path',p.avatar_path,
 'portfolio',coalesce((select jsonb_agg(jsonb_build_object('title',i.title,'object_path',i.object_path) order by i.created_at desc) from public.portfolio_items i where i.seller_id=p.id),'[]'::jsonb),
 'services',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'title',s.title,'title_en',s.title_en,'description',s.description,'category',s.category,'price',s.price,'delivery_days',s.delivery_days)) from public.services s where s.seller_id=p.id and s.status='published'),'[]'::jsonb),
 'tools',coalesce((select jsonb_agg(jsonb_build_object('key',st.tool_key,'icon',st.icon_key) order by st.created_at,st.tool_key) from public.seller_tools st where st.seller_id=p.id),'[]'::jsonb)
 )
 from public.profiles p
 join auth.users u on u.id=p.id
 join public.beta_allowlist a on a.email=lower(u.email)
 where p.slug=profile_slug and p.public_profile and p.is_seller and a.enabled limit 1
$v41$;
revoke all on function hustle_private.public_seller(text) from public;
grant execute on function hustle_private.public_seller(text) to anon,authenticated;

-- Preserve package/review aggregation, only add avatar_path to the existing
-- published catalog result. No rows are unhidden by this projection.
create or replace function hustle_private.marketplace_catalog()
returns jsonb language sql stable security definer set search_path='' as $v41$
 select coalesce(jsonb_agg(row),'[]'::jsonb) from (
  select s.id,s.title,s.title_en,s.description,s.category,s.price,s.delivery_days,
   s.revisions,s.package_name,p.display_name,p.headline,p.slug,p.avatar_path,
   (select coalesce(jsonb_agg(jsonb_build_object(
       'tier',k.tier,'name',k.name,'summary',k.summary,'price',k.price,
       'delivery_days',k.delivery_days,'revisions',k.revisions,'includes',k.includes)
       order by case k.tier when 'Basic' then 1 when 'Standard' then 2 else 3 end),'[]'::jsonb)
    from public.service_packages k where k.service_id=s.id) as packages,
   (select i.object_path from public.portfolio_items i where i.seller_id=p.id order by i.created_at desc limit 1) as image_path,
   (select count(*)::integer from public.reviews r join public.orders o on o.id=r.order_id
     where r.seller_id=p.id and o.status='completed') as review_count,
   (select round(avg(r.rating)::numeric,2) from public.reviews r join public.orders o on o.id=r.order_id
     where r.seller_id=p.id and o.status='completed') as average_rating,
   (select count(*)::integer from public.orders o where o.seller_id=p.id and o.status='completed') as completed_orders
  from public.services s
   join public.profiles p on p.id=s.seller_id
   join auth.users u on u.id=p.id
   join public.beta_allowlist a on a.email=lower(u.email)
  where s.status='published' and p.is_seller and p.public_profile
   and p.slug is not null and a.enabled order by s.created_at desc limit 200
 ) row
$v41$;
revoke all on function hustle_private.marketplace_catalog() from public;
grant execute on function hustle_private.marketplace_catalog() to anon,authenticated;
commit;
