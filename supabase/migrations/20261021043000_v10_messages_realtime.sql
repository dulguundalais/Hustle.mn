-- V10: Realtime Postgres Changes for the existing, RLS-protected inbox.
-- Never create a public broadcast channel for private message payloads.
-- Only the messages table is published; orders remain private API queries.
do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime')
     and not exists(
       select 1 from pg_publication_tables
       where pubname='supabase_realtime' and schemaname='public' and tablename='messages'
     ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end
$$;
