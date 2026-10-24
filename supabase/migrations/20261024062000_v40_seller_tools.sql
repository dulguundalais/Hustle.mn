-- V40 / seller-selected creative tools. Staging-only migration; keep public opt-in privacy.
begin;
create table if not exists public.seller_tools (
 seller_id uuid not null references public.profiles(id) on delete cascade,
 tool_key text not null check (tool_key ~ '^[a-z0-9][a-z0-9-]{0,35}
 created_at timestamptz not null default now(),
 primary key (seller_id,tool_key)
);
alter table public.seller_tools enable row level security;
revoke all on public.seller_tools from public,anon,authenticated;
grant select,insert,delete on public.seller_tools to authenticated;
grant update(icon_key) on public.seller_tools to authenticated;
drop policy if exists seller_tools_owner_read on public.seller_tools;
create policy seller_tools_owner_read on public.seller_tools for select to authenticated
 using (seller_id=(select auth.uid()));
drop policy if exists seller_tools_owner_insert on public.seller_tools;
create policy seller_tools_owner_insert on public.seller_tools for insert to authenticated
 with check (seller_id=(select auth.uid()) and exists
 (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_seller));
drop policy if exists seller_tools_owner_update on public.seller_tools;
create policy seller_tools_owner_update on public.seller_tools for update to authenticated
 using (seller_id=(select auth.uid())) with check (seller_id=(select auth.uid()));
drop policy if exists seller_tools_owner_delete on public.seller_tools;
create policy seller_tools_owner_delete on public.seller_tools for delete to authenticated
 using (seller_id=(select auth.uid()));
-- Public RPC includes only explicit seller-selected tool keys, and only for allowlisted
-- sellers who opted into a public profile. No private portfolio permissions change.
create or replace function hustle_private.public_seller(profile_slug text)
 returns jsonb language sql stable security definer set search_path='' as $v40$
 select jsonb_build_object(
 'display_name',p.display_name,
 'headline',p.headline,
 'bio',p.bio,
 'slug',p.slug,
 'portfolio',coalesce((select jsonb_agg(jsonb_build_object('title',i.title,'object_path',i.object_path) order by i.created_at desc) from public.portfolio_items i where i.seller_id=p.id),'[]'::jsonb),
 'services',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'title',s.title,'title_en',s.title_en,'description',s.description,'category',s.category,'price',s.price,'delivery_days',s.delivery_days)) from public.services s where s.seller_id=p.id and s.status='published'),'[]'::jsonb),
 'tools',coalesce((select jsonb_agg(jsonb_build_object('key',st.tool_key,'icon',st.icon_key) order by st.created_at,st.tool_key) from public.seller_tools st where st.seller_id=p.id),'[]'::jsonb)
 )
 from public.profiles p
 join auth.users u on u.id=p.id
 join public.beta_allowlist a on a.email=lower(u.email)
 where p.slug=profile_slug and p.public_profile and p.is_seller and a.enabled limit 1
 $v40$;
revoke all on function hustle_private.public_seller(text) from public;
grant execute on function hustle_private.public_seller(text) to anon,authenticated;
commit;
),
 icon_key text not null default 'auto' check (icon_key in ('auto','palette','code','layers','video','sparkles','chart','camera','file','wrench')),
 created_at timestamptz not null default now(),
 primary key (seller_id,tool_key)
);
alter table public.seller_tools enable row level security;
revoke all on public.seller_tools from public,anon,authenticated;
grant select,insert,delete on public.seller_tools to authenticated;
drop policy if exists seller_tools_owner_read on public.seller_tools;
create policy seller_tools_owner_read on public.seller_tools for select to authenticated
 using (seller_id=(select auth.uid()));
drop policy if exists seller_tools_owner_insert on public.seller_tools;
create policy seller_tools_owner_insert on public.seller_tools for insert to authenticated
 with check (seller_id=(select auth.uid()) and exists
 (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_seller));
drop policy if exists seller_tools_owner_delete on public.seller_tools;
create policy seller_tools_owner_delete on public.seller_tools for delete to authenticated
 using (seller_id=(select auth.uid()));
-- Public RPC includes only explicit seller-selected tool keys, and only for allowlisted
-- sellers who opted into a public profile. No private portfolio permissions change.
create or replace function hustle_private.public_seller(profile_slug text)
 returns jsonb language sql stable security definer set search_path='' as $v40$
 select jsonb_build_object(
 'display_name',p.display_name,
 'headline',p.headline,
 'bio',p.bio,
 'slug',p.slug,
 'portfolio',coalesce((select jsonb_agg(jsonb_build_object('title',i.title,'object_path',i.object_path) order by i.created_at desc) from public.portfolio_items i where i.seller_id=p.id),'[]'::jsonb),
 'services',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'title',s.title,'title_en',s.title_en,'description',s.description,'category',s.category,'price',s.price,'delivery_days',s.delivery_days)) from public.services s where s.seller_id=p.id and s.status='published'),'[]'::jsonb),
 'tools',coalesce((select jsonb_agg(st.tool_key order by st.created_at,st.tool_key) from public.seller_tools st where st.seller_id=p.id),'[]'::jsonb)
 )
 from public.profiles p
 join auth.users u on u.id=p.id
 join public.beta_allowlist a on a.email=lower(u.email)
 where p.slug=profile_slug and p.public_profile and p.is_seller and a.enabled limit 1
 $v40$;
revoke all on function hustle_private.public_seller(text) from public;
grant execute on function hustle_private.public_seller(text) to anon,authenticated;
commit;
