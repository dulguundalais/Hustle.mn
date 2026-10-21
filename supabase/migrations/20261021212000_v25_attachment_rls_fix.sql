-- V25 security follow-up: correct row qualification and verify storage ownership.
-- The previous policy compared m.sender_id to itself due to unqualified column names.
drop policy if exists attachment_insert on public.chat_attachments;
create policy attachment_insert on public.chat_attachments
 for insert to authenticated
 with check (
   (select public.beta_role()) is not null
   and sender_id=(select auth.uid())
   and recipient_id<>sender_id
   and object_path like sender_id::text||'/'||recipient_id::text||'/%'
   and content_type in ('image/jpeg','image/png','image/webp','application/pdf','text/plain',
      'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document')
   and exists (
     select 1 from public.messages msg
     where msg.id=chat_attachments.message_id
       and msg.sender_id=chat_attachments.sender_id
       and msg.recipient_id=chat_attachments.recipient_id
   )
   and exists (
     select 1 from storage.objects obj
     where obj.bucket_id='chat-attachments'
       and obj.name=chat_attachments.object_path
       and obj.owner_id=(select auth.uid())::text
   )
 );
create index if not exists chat_attachments_message_lookup on public.chat_attachments(message_id);
comment on policy attachment_insert on public.chat_attachments is
  'Only original sender may link a file they own to their exact sender-recipient message';
