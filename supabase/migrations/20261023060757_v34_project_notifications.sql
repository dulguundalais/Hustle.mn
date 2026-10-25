-- V34 / private beta only: durable, participant-scoped project notifications.
-- Keep the schema migration behind review; never apply to a production database.
begin;

create table if not exists public.project_notifications (
 id uuid primary key default gen_random_uuid(),
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 request_id uuid not null references public.project_requests(id) on delete cascade,
 kind text not null check (kind in ('invitation','proposal','awarded','cancelled')),
 source_id uuid not null,
 created_at timestamptz not null default now(),
 read_at timestamptz,
 unique(recipient_id,kind,source_id)
);
create index if not exists project_notifications_recipient_idx
 on public.project_notifications(recipient_id,created_at desc);

alter table public.project_notifications enable row level security;
revoke all on public.project_notifications from public,anon,authenticated;
grant select on public.project_notifications to authenticated;
grant update(read_at) on public.project_notifications to authenticated;

drop policy if exists project_notifications_owner_read on public.project_notifications;
create policy project_notifications_owner_read on public.project_notifications
 for select to authenticated using (
 recipient_id=(select auth.uid()) and (select public.beta_role()) is not null
);
drop policy if exists project_notifications_owner_mark_read on public.project_notifications;
create policy project_notifications_owner_mark_read on public.project_notifications
 for update to authenticated using (
 recipient_id=(select auth.uid()) and (select public.beta_role()) is not null
 ) with check (
 recipient_id=(select auth.uid()) and (select public.beta_role()) is not null
);
-- Only read_at has an UPDATE grant. No client insert/delete or recipient reassignment.

create schema if not exists hustle_private;
revoke all on schema hustle_private from public,anon,authenticated;

create or replace function hustle_private.project_invitation_alert()
 returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.project_notifications(recipient_id,request_id,kind,source_id)
 values(new.seller_id,new.request_id,'invitation',new.id)
 on conflict(recipient_id,kind,source_id) do nothing;
 return new;
end;
$$;

create or replace function hustle_private.project_proposal_alert()
 returns trigger language plpgsql security definer set search_path='' as $$
declare v_buyer uuid;
begin
 select buyer_id into v_buyer from public.project_requests where id=new.request_id;
 if v_buyer is not null and v_buyer<>new.seller_id then
  insert into public.project_notifications(recipient_id,request_id,kind,source_id)
  values(v_buyer,new.request_id,'proposal',new.id)
  on conflict(recipient_id,kind,source_id) do nothing;
 end if;
 return new;
end;
$$;

create or replace function hustle_private.project_award_alert()
 returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='accepted' and old.status is distinct from new.status then
  insert into public.project_notifications(recipient_id,request_id,kind,source_id)
  values(new.seller_id,new.request_id,'awarded',new.id)
  on conflict(recipient_id,kind,source_id) do nothing;
 end if;
 return new;
end;
$$;

create or replace function hustle_private.project_cancel_alert()
 returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='cancelled' and old.status is distinct from new.status then
  insert into public.project_notifications(recipient_id,request_id,kind,source_id)
  select i.seller_id,new.id,'cancelled',new.id
  from public.project_invitations i where i.request_id=new.id
  on conflict(recipient_id,kind,source_id) do nothing;
 end if;
 return new;
end;
$$;

revoke all on function hustle_private.project_invitation_alert() from public,anon,authenticated;
revoke all on function hustle_private.project_proposal_alert() from public,anon,authenticated;
revoke all on function hustle_private.project_award_alert() from public,anon,authenticated;
revoke all on function hustle_private.project_cancel_alert() from public,anon,authenticated;

drop trigger if exists v34_project_invitation_alert on public.project_invitations;
create trigger v34_project_invitation_alert after insert on public.project_invitations
 for each row execute function hustle_private.project_invitation_alert();
drop trigger if exists v34_project_proposal_alert on public.project_proposals;
create trigger v34_project_proposal_alert after insert on public.project_proposals
 for each row execute function hustle_private.project_proposal_alert();
drop trigger if exists v34_project_award_alert on public.project_proposals;
create trigger v34_project_award_alert after update of status on public.project_proposals
 for each row execute function hustle_private.project_award_alert();
drop trigger if exists v34_project_cancel_alert on public.project_requests;
create trigger v34_project_cancel_alert after update of status on public.project_requests
 for each row execute function hustle_private.project_cancel_alert();

commit;
