-- Public sharing is explicit seller opt-in. Only approved sellers and their published services are exposed.
-- These read-only SECURITY DEFINER helpers intentionally support anonymous social crawlers;
-- they return an allowlisted projection, never auth identities, email addresses or order data.
grant usage on schema hustle_private to anon;
create function hustle_private.public_seller(profile_slug text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('display_name',p.display_name,'headline',p.headline,'bio',p.bio,'slug',p.slug,
 'portfolio',coalesce((select jsonb_agg(jsonb_build_object('title',i.title,'object_path',i.object_path)) from public.portfolio_items i where i.seller_id=p.id),'[]'::jsonb),
 'services',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'title',s.title,'title_en',s.title_en,'description',s.description,'category',s.category,'price',s.price,'delivery_days',s.delivery_days)) from public.services s where s.seller_id=p.id and s.status='published'),'[]'::jsonb))
 from public.profiles p join auth.users u on u.id=p.id join public.beta_allowlist a on a.email=lower(u.email)
 where p.slug=profile_slug and p.public_profile and p.is_seller and a.enabled limit 1
$$;
revoke all on function hustle_private.public_seller(text) from public;
grant execute on function hustle_private.public_seller(text) to anon,authenticated;
create function public.public_seller(profile_slug text) returns jsonb language sql stable security invoker set search_path='' as $$ select hustle_private.public_seller(profile_slug) $$;
revoke all on function public.public_seller(text) from public;
grant execute on function public.public_seller(text) to anon,authenticated;
create function hustle_private.public_portfolio_image(object_name text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.portfolio_items i join public.profiles p on p.id=i.seller_id join auth.users u on u.id=p.id join public.beta_allowlist a on a.email=lower(u.email)
 where i.object_path=object_name and p.public_profile and p.is_seller and a.enabled)
$$;
revoke all on function hustle_private.public_portfolio_image(text) from public;
grant execute on function hustle_private.public_portfolio_image(text) to anon,authenticated;
create policy public_portfolio_images on storage.objects for select to anon using(bucket_id='portfolio' and hustle_private.public_portfolio_image(name));
