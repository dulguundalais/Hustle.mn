-- V47: Chat safety for the open beta — personal blocks, abuse reports with an
-- admin review queue, and message rate limits enforced in the database.
-- Additive only: no existing table, policy or row is changed or removed.
begin;

-- 1. Personal blocks. A block stops new messages in BOTH directions. The blocked
--    person cannot read block rows, so they are never told who blocked them.
create table public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index user_blocks_blocked_idx on public.user_blocks(blocked_id);
alter table public.user_blocks enable row level security;
revoke all on public.user_blocks from public, anon, authenticated;
grant select, delete on public.user_blocks to authenticated;
grant insert (blocker_id, blocked_id) on public.user_blocks to authenticated;
create policy user_blocks_owner_read on public.user_blocks for select to authenticated
  using (blocker_id = (select auth.uid()) and (select public.beta_role()) is not null);
create policy user_blocks_owner_add on public.user_blocks for insert to authenticated
  with check (blocker_id = (select auth.uid()) and (select public.beta_role()) is not null);
create policy user_blocks_owner_remove on public.user_blocks for delete to authenticated
  using (blocker_id = (select auth.uid()) and (select public.beta_role()) is not null);

-- 2. Abuse reports. Reporters see their own reports; admins review all of them.
create table public.message_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  message_id uuid references public.messages(id) on delete set null,
  reason text not null check (reason in ('spam','harassment','scam','inappropriate','other')),
  details text not null default '' check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open','actioned','dismissed')),
  admin_note text not null default '' check (char_length(admin_note) <= 1000),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  check (reporter_id <> reported_id)
);
create index message_reports_queue_idx on public.message_reports(status, created_at desc);
create index message_reports_reporter_idx on public.message_reports(reporter_id, created_at desc);
create index message_reports_reported_idx on public.message_reports(reported_id);
create index message_reports_message_idx on public.message_reports(message_id);
create index message_reports_reviewer_idx on public.message_reports(reviewed_by);
-- One open report per reporter and message prevents duplicate flooding.
create unique index message_reports_one_open_per_message
  on public.message_reports(reporter_id, message_id) where message_id is not null and status = 'open';
alter table public.message_reports enable row level security;
revoke all on public.message_reports from public, anon, authenticated;
grant select on public.message_reports to authenticated;
grant insert (reporter_id, reported_id, message_id, reason, details) on public.message_reports to authenticated;
grant update (status, admin_note) on public.message_reports to authenticated;
create policy message_reports_read on public.message_reports for select to authenticated
  using ((select public.beta_role()) is not null
         and (reporter_id = (select auth.uid()) or (select public.beta_role()) = 'admin'));
-- A reported message must be one the reported person sent to the reporter.
create policy message_reports_add on public.message_reports for insert to authenticated
  with check ((select public.beta_role()) is not null
    and reporter_id = (select auth.uid())
    and (message_id is null or exists (
      select 1 from public.messages m
      where m.id = message_id and m.sender_id = reported_id and m.recipient_id = (select auth.uid()))));
create policy message_reports_admin_review on public.message_reports for update to authenticated
  using ((select public.beta_role()) = 'admin') with check ((select public.beta_role()) = 'admin');

create function hustle_private.message_report_guard() returns trigger
language plpgsql security invoker set search_path = '' as $report$
begin
  if TG_OP = 'INSERT' then
    if (select count(*) from public.message_reports r
        where r.reporter_id = new.reporter_id and r.created_at > now() - interval '24 hours') >= 10 then
      raise exception 'Report limit reached. Please try again tomorrow.' using hint = 'hx_report_limit';
    end if;
    new.status := 'open'; new.admin_note := ''; new.created_at := now();
    new.reviewed_at := null; new.reviewed_by := null; new.details := btrim(new.details);
    return new;
  end if;
  if new.id <> old.id or new.reporter_id <> old.reporter_id or new.reported_id <> old.reported_id
     or new.message_id is distinct from old.message_id or new.reason <> old.reason
     or new.details <> old.details or new.created_at <> old.created_at then
    raise exception 'Report details are immutable';
  end if;
  new.reviewed_at := now(); new.reviewed_by := auth.uid();
  return new;
end
$report$;
create trigger message_report_guard before insert or update on public.message_reports
  for each row execute function hustle_private.message_report_guard();
create trigger audit_message_reports after update on public.message_reports
  for each row execute function hustle_private.audit_change();

-- 3. Message guard: blocks and rate limits apply to every message path,
--    including send_chat_attachment. Definer rights are needed to see the
--    recipient's blocks, which the sender cannot read. Admins skip rate limits.
create function hustle_private.message_safety_guard() returns trigger
language plpgsql security definer set search_path = '' as $guard$
declare
  v_admin boolean := public.beta_role() = 'admin';
begin
  if exists (
    select 1 from public.user_blocks b
    where (b.blocker_id = new.recipient_id and b.blocked_id = new.sender_id)
       or (b.blocker_id = new.sender_id and b.blocked_id = new.recipient_id)
  ) then
    raise exception 'This conversation is not available.' using hint = 'hx_blocked';
  end if;
  if v_admin then return new; end if;
  if (select count(*) from public.messages m
      where m.sender_id = new.sender_id and m.created_at > now() - interval '1 minute') >= 15 then
    raise exception 'You are sending messages too quickly. Please wait a minute.' using hint = 'hx_rate_minute';
  end if;
  if (select count(*) from public.messages m
      where m.sender_id = new.sender_id and m.created_at > now() - interval '1 hour') >= 150 then
    raise exception 'Hourly message limit reached. Please try again later.' using hint = 'hx_rate_hour';
  end if;
  -- Starting brand-new conversations is limited separately to stop cold spam.
  if not exists (
    select 1 from public.messages m
    where (m.sender_id = new.sender_id and m.recipient_id = new.recipient_id)
       or (m.sender_id = new.recipient_id and m.recipient_id = new.sender_id)
  ) and (
    select count(*) from (
      select m.recipient_id from public.messages m
      where m.sender_id = new.sender_id
      group by m.recipient_id
      having min(m.created_at) > now() - interval '24 hours'
         and not exists (
           select 1 from public.messages r
           where r.sender_id = m.recipient_id and r.recipient_id = new.sender_id
             and r.created_at < min(m.created_at))
    ) started
  ) >= 20 then
    raise exception 'You have started many new conversations today. Please try again tomorrow.' using hint = 'hx_rate_new';
  end if;
  return new;
end
$guard$;
revoke all on function hustle_private.message_safety_guard() from public, anon, authenticated;
create trigger message_safety_guard before insert on public.messages
  for each row execute function hustle_private.message_safety_guard();

-- 4. Admin review queue with names, the reported message and the reported
--    account's e-mail (needed for the existing manage_beta access control).
create function hustle_private.admin_message_reports(p_status text default 'open')
returns table (id uuid, status text, reason text, details text, admin_note text, created_at timestamptz,
  reviewed_at timestamptz, reporter_id uuid, reporter_name text, reported_id uuid, reported_name text,
  reported_email text, reported_open_reports integer, message_body text, message_created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $queue$
begin
  if auth.uid() is null or public.beta_role() is distinct from 'admin' then
    raise exception 'Admin only' using errcode = '42501';
  end if;
  return query
  select r.id, r.status, r.reason, r.details, r.admin_note, r.created_at, r.reviewed_at,
         r.reporter_id, rp.display_name, r.reported_id, dp.display_name, lower(u.email)::text,
         (select count(*)::integer from public.message_reports o where o.reported_id = r.reported_id and o.status = 'open'),
         m.body, m.created_at
  from public.message_reports r
  join public.profiles rp on rp.id = r.reporter_id
  join public.profiles dp on dp.id = r.reported_id
  left join auth.users u on u.id = r.reported_id
  left join public.messages m on m.id = r.message_id
  where p_status = 'all' or r.status = p_status
  order by r.created_at desc
  limit 200;
end
$queue$;
revoke all on function hustle_private.admin_message_reports(text) from public, anon;
grant execute on function hustle_private.admin_message_reports(text) to authenticated;
create function public.admin_message_reports(p_status text default 'open')
returns table (id uuid, status text, reason text, details text, admin_note text, created_at timestamptz,
  reviewed_at timestamptz, reporter_id uuid, reporter_name text, reported_id uuid, reported_name text,
  reported_email text, reported_open_reports integer, message_body text, message_created_at timestamptz)
language sql stable security invoker set search_path = '' as $wrap$
  select * from hustle_private.admin_message_reports(p_status)
$wrap$;
revoke all on function public.admin_message_reports(text) from public, anon;
grant execute on function public.admin_message_reports(text) to authenticated;

commit;
