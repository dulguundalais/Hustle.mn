-- Public reputation includes only verified completed orders from opted-in published sellers.
-- Individual review text and buyer identity remain authenticated-only.
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
$$;
