-- V42 closed-beta seller profile cover photo. Retains the private portfolio bucket.
begin;
alter table public.profiles add column if not exists cover_path text;
alter table public.profiles add column if not exists cover_focus_y smallint not null default 50;
do $v42$
begin
 if not exists(select 1 from pg_constraint where conname='profiles_cover_owner_path' and conrelid='public.profiles'::regclass) then
  alter table public.profiles add constraint profiles_cover_owner_path
    check (cover_path is null or cover_path ~ ('^'||id::text||'/[a-f0-9-]{36}[.](jpg|png|webp)$'));
 end if;
 if not exists(select 1 from pg_constraint where conname='profiles_cover_focus_range' and conrelid='public.profiles'::regclass) then
  alter table public.profiles add constraint profiles_cover_focus_range check (cover_focus_y between 0 and 100);
 end if;
end $v42$;

-- Reuse the V41 policy, preserving draft/previous image privacy:
-- only the *current* photo or cover of an opted-in, allowlisted seller is public.
create or replace function hustle_private.public_avatar_image(object_name text)
returns boolean language sql stable security definer set search_path='' as $v42$
 select exists(
  select 1 from public.profiles p
  join auth.users u on u.id=p.id
  join public.beta_allowlist a on a.email=lower(u.email)
  where (p.avatar_path=object_name or p.cover_path=object_name)
    and p.public_profile and p.is_seller and a.enabled
 )
$v42$;
revoke all on function hustle_private.public_avatar_image(text) from public;
grant execute on function hustle_private.public_avatar_image(text) to anon,authenticated;
-- The V41 public_seller_avatar_images policy already references this function.
-- Preserve V40 selected software tools, published services and selected portfolio.
create or replace function hustle_private.public_seller(profile_slug text)
returns jsonb language sql stable security definer set search_path='' as $v42$
 select jsonb_build_object(
  'display_name',p.display_name,
  'headline',p.headline,
  'bio',p.bio,
  'skills',p.skills,
  'slug',p.slug,
  'avatar_path',p.avatar_path,
  'cover_path',p.cover_path,
  'cover_focus_y',p.cover_focus_y,
  'portfolio',coalesce((select jsonb_agg(jsonb_build_object('title',i.title,'object_path',i.object_path) order by i.created_at desc)
    from public.portfolio_items i where i.seller_id=p.id),'[]'::jsonb),
  'services',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'title',s.title,'title_en',s.title_en,'description',s.description,'category',s.category,'price',s.price,'delivery_days',s.delivery_days))
    from public.services s where s.seller_id=p.id and s.status='published'),'[]'::jsonb),
  'tools',coalesce((select jsonb_agg(jsonb_build_object('key',st.tool_key,'icon',st.icon_key) order by st.created_at,st.tool_key)
    from public.seller_tools st where st.seller_id=p.id),'[]'::jsonb)
 )
 from public.profiles p
 join auth.users u on u.id=p.id
 join public.beta_allowlist a on a.email=lower(u.email)
 where p.slug=profile_slug and p.public_profile and p.is_seller and a.enabled limit 1
$v42$;
revoke all on function hustle_private.public_seller(text) from public;
grant execute on function hustle_private.public_seller(text) to anon,authenticated;
commit;
