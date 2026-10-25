-- V33: Closed-beta Project Request, opt-in matching, proposals, and atomic proposal→order award.
-- No payments. No anonymous data writes. Existing orders trigger remains authoritative.
-- Applied to beta only after review/CI; never changes the live production domain.
begin;

alter table public.profiles add column if not exists accepting_projects boolean not null default false;

create table if not exists public.project_requests (
 id uuid primary key default gen_random_uuid(),
 buyer_id uuid not null references public.profiles(id),
 title text not null check (char_length(btrim(title)) between 8 and 120),
 brief text not null check (char_length(btrim(brief)) between 20 and 2000),
 audience text not null check (audience in ('personal','business')),
 category text not null check (category in ('design','ui','video','translation','marketing','web','interior','ai','proposals')),
 budget_max integer check (budget_max is null or budget_max between 1000 and 100000000),
 preferred_days integer check (preferred_days is null or preferred_days between 1 and 365),
 status text not null default 'open' check (status in ('open','awarded','cancelled')),
 order_id uuid unique references public.orders(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists project_requests_buyer_idx on public.project_requests(buyer_id,created_at desc);

create table if not exists public.project_invitations (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.project_requests(id) on delete cascade,
 seller_id uuid not null references public.profiles(id),
 status text not null default 'invited' check (status in ('invited','proposed','declined','closed')),
 created_at timestamptz not null default now(),
 unique(request_id,seller_id)
);
create index if not exists project_invites_seller_idx on public.project_invitations(seller_id,created_at desc);

create table if not exists public.project_proposals (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.project_requests(id) on delete cascade,
 seller_id uuid not null references public.profiles(id),
 service_id uuid not null references public.services(id),
 tier text not null check (tier in ('Basic','Standard','Premium')),
 quoted_price integer not null check (quoted_price between 1000 and 100000000),
 delivery_days integer not null check (delivery_days between 1 and 365),
 message text not null check (char_length(btrim(message)) between 20 and 1500),
 status text not null default 'pending' check (status in ('pending','accepted','declined')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(request_id,seller_id)
);
create index if not exists project_proposals_request_idx on public.project_proposals(request_id,created_at desc);

alter table public.project_requests enable row level security;
alter table public.project_invitations enable row level security;
alter table public.project_proposals enable row level security;

-- Requests are readable by their buyers. Sellers receive invitation details via
-- an explicitly filtered read-only RPC, not broad SELECT on buyer records.
create policy project_requests_buyer_read on public.project_requests for select
 to authenticated using (buyer_id=(select auth.uid()) and (select public.beta_role()) is not null);
create policy project_invites_participants_read on public.project_invitations for select
 to authenticated using (
  (select public.beta_role()) is not null and
  (seller_id=(select auth.uid()) or exists(
   select 1 from public.project_requests r where r.id=request_id and r.buyer_id=(select auth.uid())
  ))
 );
create policy project_proposals_participants_read on public.project_proposals for select
 to authenticated using (
  (select public.beta_role()) is not null and
  (seller_id=(select auth.uid()) or exists(
    select 1 from public.project_requests r where r.id=request_id and r.buyer_id=(select auth.uid())
  ))
 );

revoke all on public.project_requests,public.project_invitations,public.project_proposals from anon,authenticated;
grant select on public.project_requests,public.project_invitations,public.project_proposals to authenticated;

-- Caller consent creates AND dispatches a request atomically. No silent broadcasts.
create or replace function public.create_project_request(
 p_title text,p_brief text,p_category text,p_audience text,
 p_budget_max integer default null,p_preferred_days integer default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_buyer uuid:=auth.uid();
 v_id uuid;
 v_count integer:=0;
begin
 if v_buyer is null or public.beta_role() is null
    or not exists(select 1 from public.profiles where id=v_buyer) then
  raise exception 'Approved beta buyer profile required';
 end if;
 if char_length(btrim(coalesce(p_title,''))) not between 8 and 120
    or char_length(btrim(coalesce(p_brief,''))) not between 20 and 2000
    or p_category not in ('design','ui','video','translation','marketing','web','interior','ai','proposals')
    or p_audience not in ('personal','business')
    or (p_budget_max is not null and p_budget_max not between 1000 and 100000000)
    or (p_preferred_days is not null and p_preferred_days not between 1 and 365) then
  raise exception 'Invalid project details';
 end if;
 if (select count(*) from public.project_requests
     where buyer_id=v_buyer and created_at>now()-interval '24 hours')>=5 then
  raise exception 'Daily project request limit reached';
 end if;
 insert into public.project_requests(buyer_id,title,brief,category,audience,budget_max,preferred_days)
 values(v_buyer,btrim(p_title),btrim(p_brief),p_category,p_audience,p_budget_max,p_preferred_days)
 returning id into v_id;

 -- Up to five eligible opt-in, beta-approved real sellers with published work in
 -- the requested category. Do not expose other users' private signup details.
 with eligible as (
  select s.seller_id, max(s.updated_at) as latest
  from public.services s
  join public.profiles p on p.id=s.seller_id
  join auth.users u on u.id=p.id
  join public.beta_allowlist b on b.email=lower(u.email) and b.enabled=true
  where s.status='published'
    and s.category=p_category and s.seller_id<>v_buyer
    and p.is_seller=true and p.public_profile=true
    and p.accepting_projects=true
  group by s.seller_id
  order by latest desc,s.seller_id
  limit 5
 ), inserted as (
  insert into public.project_invitations(request_id,seller_id)
  select v_id,seller_id from eligible
  returning id
 )
 select count(*) into v_count from inserted;
 return jsonb_build_object('id',v_id,'invited',v_count,'status','open');
end;
$$;

create or replace function public.seller_project_inbox()
 returns table(id uuid,request_id uuid,title text,brief text,category text,audience text,
 budget_max integer,preferred_days integer,created_at timestamptz,invite_status text)
 language sql stable security definer set search_path='' as $$
 select i.id,r.id,r.title,r.brief,r.category,r.audience,
        r.budget_max,r.preferred_days,r.created_at,i.status
 from public.project_invitations i
 join public.project_requests r on r.id=i.request_id
 where i.seller_id=auth.uid()
   and auth.uid() is not null
   and public.beta_role() is not null
   and r.status='open'
 order by r.created_at desc
 limit 100;
$$;

create or replace function public.submit_project_proposal(
 p_invitation_id uuid,p_service_id uuid,p_tier text,p_message text
) returns uuid language plpgsql security definer set search_path='' as $$
declare
 v_seller uuid:=auth.uid();
 v_invite public.project_invitations;
 v_request public.project_requests;
 v_service public.services;
 v_package public.service_packages;
 v_id uuid;
begin
 if v_seller is null or public.beta_role() is null then raise exception 'Beta seller required';end if;
 select * into v_invite from public.project_invitations
  where id=p_invitation_id and seller_id=v_seller for update;
 if not found or v_invite.status not in ('invited','proposed') then
  raise exception 'This invitation is not available';
 end if;
 select * into v_request from public.project_requests where id=v_invite.request_id for update;
 if not found or v_request.status<>'open' or v_request.buyer_id=v_seller then
  raise exception 'Project closed or unauthorized';
 end if;
 select * into v_service from public.services
  where id=p_service_id and seller_id=v_seller and status='published'
    and category=v_request.category;
 if not found then raise exception 'Select your published service in this category';end if;
 select * into v_package from public.service_packages
  where service_id=p_service_id and tier=p_tier;
 if not found then raise exception 'Invalid package';end if;
 if char_length(btrim(coalesce(p_message,''))) not between 20 and 1500 then
  raise exception 'Proposal message must be 20-1500 characters';
 end if;
 insert into public.project_proposals
 (request_id,seller_id,service_id,tier,quoted_price,delivery_days,message)
 values(v_request.id,v_seller,p_service_id,v_package.tier,v_package.price,
        v_package.delivery_days,btrim(p_message))
 on conflict (request_id,seller_id) do update
 set service_id=excluded.service_id,tier=excluded.tier,
     quoted_price=excluded.quoted_price,delivery_days=excluded.delivery_days,
     message=excluded.message,updated_at=now(),status='pending'
 returning id into v_id;
 update public.project_invitations set status='proposed' where id=v_invite.id;
 return v_id;
end;
$$;

create or replace function public.decline_project_invitation(p_invitation_id uuid)
 returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or public.beta_role() is null then raise exception 'Beta access required';end if;
 update public.project_invitations set status='declined'
 where id=p_invitation_id and seller_id=auth.uid() and status='invited';
 if not found then raise exception 'Invitation not available';end if;
end;
$$;

create or replace function public.award_project_proposal(p_proposal_id uuid)
 returns uuid language plpgsql security definer set search_path='' as $$
declare
 v_request public.project_requests;
 v_proposal public.project_proposals;
 v_pkg public.service_packages;
 v_order uuid;
begin
 if auth.uid() is null or public.beta_role() is null then raise exception 'Beta access required';end if;
 -- Lock project before proposal to serialize awards for this request.
 select r.* into v_request from public.project_requests r
 join public.project_proposals p on p.request_id=r.id
 where p.id=p_proposal_id for update of r;
 if not found or v_request.buyer_id<>auth.uid() or v_request.status<>'open' then
  raise exception 'Project not available for award';
 end if;
 select * into v_proposal from public.project_proposals where id=p_proposal_id for update;
 if not found or v_proposal.status<>'pending'
   or not exists(select 1 from public.project_invitations i
    where i.request_id=v_request.id and i.seller_id=v_proposal.seller_id and i.status='proposed')
 then raise exception 'Proposal unavailable';end if;
 select pkg.* into v_pkg from public.service_packages pkg
 join public.services s on s.id=pkg.service_id
 where pkg.service_id=v_proposal.service_id and pkg.tier=v_proposal.tier
   and s.status='published' and s.seller_id=v_proposal.seller_id;
 if not found or v_pkg.price<>v_proposal.quoted_price
   or v_pkg.delivery_days<>v_proposal.delivery_days then
  raise exception 'Service package changed; ask seller to refresh proposal';
 end if;
 insert into public.orders(service_id,buyer_id,seller_id,service_title,
    quoted_price,brief,package_name)
 values(v_proposal.service_id,auth.uid(),v_proposal.seller_id,
    (select title from public.services where id=v_proposal.service_id),
    v_proposal.quoted_price,v_request.brief,v_proposal.tier)
 returning id into v_order;
 update public.project_requests set status='awarded',order_id=v_order,updated_at=now()
 where id=v_request.id;
 update public.project_proposals set status=case when id=p_proposal_id then 'accepted' else 'declined' end,
  updated_at=now() where request_id=v_request.id;
 update public.project_invitations set status='closed' where request_id=v_request.id;
 return v_order;
end;
$$;

create or replace function public.cancel_project_request(p_request_id uuid)
 returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or public.beta_role() is null then raise exception 'Beta access required';end if;
 update public.project_requests set status='cancelled',updated_at=now()
 where id=p_request_id and buyer_id=auth.uid() and status='open';
 if not found then raise exception 'Project not available';end if;
 update public.project_invitations set status='closed' where request_id=p_request_id;
 update public.project_proposals set status='declined',updated_at=now() where request_id=p_request_id and status='pending';
end;
$$;

revoke execute on function public.create_project_request(text,text,text,text,integer,integer) from public,anon;
revoke execute on function public.seller_project_inbox() from public,anon;
revoke execute on function public.submit_project_proposal(uuid,uuid,text,text) from public,anon;
revoke execute on function public.decline_project_invitation(uuid) from public,anon;
revoke execute on function public.award_project_proposal(uuid) from public,anon;
revoke execute on function public.cancel_project_request(uuid) from public,anon;
grant execute on function public.create_project_request(text,text,text,text,integer,integer) to authenticated;
grant execute on function public.seller_project_inbox() to authenticated;
grant execute on function public.submit_project_proposal(uuid,uuid,text,text) to authenticated;
grant execute on function public.decline_project_invitation(uuid) to authenticated;
grant execute on function public.award_project_proposal(uuid) to authenticated;
grant execute on function public.cancel_project_request(uuid) to authenticated;

commit;
