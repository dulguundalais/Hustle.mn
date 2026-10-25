-- Public projection contains only already consented seller profile content.
create function hustle_private.marketplace_catalog() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(row),'[]'::jsonb) from (
 select s.id,s.title,s.title_en,s.description,s.category,s.price,s.delivery_days,s.revisions,s.package_name,p.display_name,p.headline,p.slug,
 (select i.object_path from public.portfolio_items i where i.seller_id=p.id order by i.created_at desc limit 1) as image_path
 from public.services s join public.profiles p on p.id=s.seller_id join auth.users u on u.id=p.id join public.beta_allowlist a on a.email=lower(u.email)
 where s.status='published' and p.is_seller and p.public_profile and p.slug is not null and a.enabled order by s.created_at desc limit 200
 ) row
$$;
revoke all on function hustle_private.marketplace_catalog() from public;
grant execute on function hustle_private.marketplace_catalog() to anon,authenticated;
create function public.marketplace_catalog() returns jsonb language sql stable security invoker set search_path='' as $$ select hustle_private.marketplace_catalog() $$;
revoke all on function public.marketplace_catalog() from public;
grant execute on function public.marketplace_catalog() to anon,authenticated;
