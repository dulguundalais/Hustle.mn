-- V35: opt-in proposal collaboration and durable order lifecycle notices.
-- Closed-beta only; no charges, payouts, or escrow.
begin;

alter table public.project_proposals drop constraint if exists project_proposals_status_check;
alter table public.project_proposals add constraint project_proposals_status_check
 check(status in ('pending','accepted','declined','withdrawn'));

-- Do not race with buyer award: take request lock before proposal lock.
create or replace function public.withdraw_project_proposal(p_proposal_id uuid)
 returns void language plpgsql security definer set search_path='' as $$
declare
 v_request_id uuid;
 v_request public.project_requests;
 v_proposal public.project_proposals;
begin
 if auth.uid() is null or public.beta_role() is null then raise exception 'Beta seller required';end if;
 select request_id into v_request_id from public.project_proposals
 where id=p_proposal_id and seller_id=auth.uid();
 if v_request_id is null then raise exception 'Proposal unavailable';end if;
 select * into v_request from public.project_requests where id=v_request_id for update;
 if not found or v_request.status<>'open' or v_request.buyer_id=auth.uid() then
  raise exception 'Project no longer open';end if;
 select * into v_proposal from public.project_proposals where id=p_proposal_id
 and seller_id=auth.uid() for update;
 if not found or v_proposal.status<>'pending' then raise exception 'Proposal cannot be withdrawn';end if;
 update public.project_proposals set status='withdrawn',updated_at=now() where id=p_proposal_id;
 update public.project_invitations set status='invited'
 where request_id=v_request_id and seller_id=auth.uid() and status='proposed';
end;
$$;
revoke execute on function public.withdraw_project_proposal(uuid) from public,anon;
grant execute on function public.withdraw_project_proposal(uuid) to authenticated;

create table if not exists public.order_notifications (
 id uuid primary key default gen_random_uuid(),
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 order_id uuid not null references public.orders(id) on delete cascade,
 kind text not null check(kind in ('requested','accepted','in_progress','delivered','completed','rejected','cancelled','revision_requested')),
 created_at timestamptz not null default now(),
 read_at timestamptz
);
create index if not exists order_notifications_inbox_idx on public.order_notifications(recipient_id,created_at desc);
alter table public.order_notifications enable row level security;
revoke all on public.order_notifications from public,anon,authenticated;
grant select on public.order_notifications to authenticated;
grant update(read_at) on public.order_notifications to authenticated;

create policy order_notifications_recipient_read on public.order_notifications
 for select to authenticated using(
 recipient_id=(select auth.uid()) and (select public.beta_role()) is not null
);
create policy order_notifications_recipient_update on public.order_notifications
 for update to authenticated using(
 recipient_id=(select auth.uid()) and (select public.beta_role()) is not null
 ) with check(
 recipient_id=(select auth.uid()) and (select public.beta_role()) is not null
);

create or replace function hustle_private.v35_order_notify()
 returns trigger language plpgsql security definer set search_path='' as $$
declare v_target uuid; v_kind text;
begin
 if TG_OP='INSERT' then
  v_target:=new.seller_id;v_kind:='requested';
 elsif new.status is distinct from old.status then
  v_target:=case when new.status in ('completed','cancelled','revision_requested') then new.seller_id
            when new.status='in_progress' and new.revisions_used>old.revisions_used then new.seller_id
            else new.buyer_id end;
  v_kind:=case when new.status='in_progress' and new.revisions_used>old.revisions_used
             then 'revision_requested' else new.status end;
 else
  return new;
 end if;
 if v_target is not null then
  insert into public.order_notifications(recipient_id,order_id,kind)
  values(v_target,new.id,v_kind);
 end if;
 return new;
end;
$$;
revoke execute on function hustle_private.v35_order_notify() from public,anon,authenticated;
drop trigger if exists v35_order_notification on public.orders;
create trigger v35_order_notification after insert or update of status on public.orders
 for each row execute function hustle_private.v35_order_notify();

commit;
