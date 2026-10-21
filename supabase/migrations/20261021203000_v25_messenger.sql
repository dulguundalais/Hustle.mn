alter table public.messages add column if not exists read_at timestamptz;
grant update(read_at) on public.messages to authenticated;
create policy messages_read_receipt on public.messages for update to authenticated using(recipient_id=auth.uid() and public.beta_role() is not null) with check(recipient_id=auth.uid() and public.beta_role() is not null);
create function hustle_private.receipt_guard() returns trigger language plpgsql set search_path='' as $body$
begin
 if new.sender_id<>old.sender_id or new.recipient_id<>old.recipient_id or new.body<>old.body or new.id<>old.id or new.created_at<>old.created_at then raise exception 'Immutable message';end if;
 if old.read_at is not null or auth.uid()<>old.recipient_id then raise exception 'Invalid receipt';end if;
 new.read_at=now();return new;
end $body$;
create trigger receipt_guard before update on public.messages for each row execute function hustle_private.receipt_guard();
create table public.chat_attachments(
 id uuid primary key default gen_random_uuid(),
 message_id uuid not null unique references public.messages(id),
 sender_id uuid not null references public.profiles(id),
 recipient_id uuid not null references public.profiles(id),
 object_path text not null unique,
 file_name text not null check(length(file_name) between 1 and 180),
 content_type text not null,
 byte_size integer not null check(byte_size between 1 and 10485760),
 created_at timestamptz not null default now(),
 check(object_path like sender_id::text||'/'||recipient_id::text||'/%')
);
alter table public.chat_attachments enable row level security;
grant select,insert on public.chat_attachments to authenticated;
create policy attachment_view on public.chat_attachments for select to authenticated using(public.beta_role() is not null and auth.uid() in(sender_id,recipient_id));
create policy attachment_insert on public.chat_attachments for insert to authenticated with check(public.beta_role() is not null and sender_id=auth.uid() and exists(select 1 from public.messages m where m.id=message_id and m.sender_id=sender_id and m.recipient_id=recipient_id));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('chat-attachments','chat-attachments',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf','text/plain','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']) on conflict (id) do nothing;
create policy chat_file_upload on storage.objects for insert to authenticated with check(bucket_id='chat-attachments' and public.beta_role() is not null and (storage.foldername(name))[1]=auth.uid()::text);
create policy chat_file_read on storage.objects for select to authenticated using(bucket_id='chat-attachments' and public.beta_role() is not null and ((storage.foldername(name))[1]=auth.uid()::text or exists(select 1 from public.chat_attachments a where a.object_path=storage.objects.name and a.recipient_id=auth.uid())));
create policy chat_file_remove on storage.objects for delete to authenticated using(bucket_id='chat-attachments' and public.beta_role() is not null and (storage.foldername(name))[1]=auth.uid()::text);
create table public.messenger_presence(user_id uuid primary key references public.profiles(id),share_activity boolean not null default false,last_active_at timestamptz not null default now());
alter table public.messenger_presence enable row level security;
grant select,insert,update on public.messenger_presence to authenticated;
create policy presence_read on public.messenger_presence for select to authenticated using(public.beta_role() is not null and (share_activity or user_id=auth.uid()));
create policy presence_add on public.messenger_presence for insert to authenticated with check(public.beta_role() is not null and user_id=auth.uid());
create policy presence_edit on public.messenger_presence for update to authenticated using(user_id=auth.uid() and public.beta_role() is not null) with check(user_id=auth.uid() and public.beta_role() is not null);

-- Accurate presence server timestamp: clients may opt in/out but cannot fabricate last-active times.
create function hustle_private.presence_stamp() returns trigger language plpgsql security invoker set search_path='' as $presence$
begin
 if new.user_id is distinct from auth.uid() then raise exception 'Presence ownership mismatch';end if;
 new.last_active_at=now();
 return new;
end $presence$;
create trigger presence_stamp before insert or update on public.messenger_presence
 for each row execute function hustle_private.presence_stamp();

-- A privacy-safe seller metric, not individual buyer correspondence. Minimum three
-- distinct first replies, real messages only. Limit output to public opted-in sellers.
create function public.seller_average_response(target_seller uuid)
returns jsonb language sql stable security definer set search_path='' as $response$
with visible as (
 select p.id
 from public.profiles p
 join auth.users u on u.id=p.id
 join public.beta_allowlist a on a.email=lower(u.email)
 where p.id=target_seller and p.is_seller and p.public_profile and a.enabled
 and auth.uid() is not null and public.beta_role() is not null
), first_request as (
 select m.sender_id as buyer_id,min(m.created_at) as request_at
 from public.messages m join visible s on m.recipient_id=s.id
 where m.sender_id<>target_seller
 group by m.sender_id
), first_answer as (
 select b.buyer_id, extract(epoch from min(m.created_at)-b.request_at)/60 as minutes
 from first_request b join public.messages m on m.sender_id=target_seller
   and m.recipient_id=b.buyer_id and m.created_at>b.request_at
   and m.created_at<=b.request_at+interval '7 days'
 group by b.buyer_id,b.request_at
)
select jsonb_build_object('samples',count(*)::int,'average_minutes',
 case when count(*)>=3 then round(avg(minutes))::int else null end)
from first_answer
$response$;
revoke all on function public.seller_average_response(uuid) from public,anon;
grant execute on function public.seller_average_response(uuid) to authenticated;
