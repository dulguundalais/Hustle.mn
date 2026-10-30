-- Reproduce observed legacy privileges in an isolated DB, then exercise the
-- exact proposed hardening. No destructive TRUNCATE is executed.
grant truncate,references,trigger on
 public.services,public.profiles,public.portfolio_items,public.business_rules,
 public.partner_codes,public.referrals,public.audit_events,public.orders,
 public.messages,public.saved_services,public.reviews,
 public.chat_attachments,public.messenger_presence to authenticated;
grant truncate,references,trigger on public.chat_attachments,public.messenger_presence to anon;
do $$ begin
 if not has_table_privilege('authenticated','public.orders','TRUNCATE')
 then raise exception 'Legacy grant fixture was not installed'; end if;
end $$;
\ir ../../supabase/proposals/revoke-legacy-table-privileges.sql
do $test$
declare t record; role_name text; privilege_name text;
begin
 for t in select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind in ('r','p')
 loop
  foreach role_name in array array['anon','authenticated'] loop
   foreach privilege_name in array array['TRUNCATE','REFERENCES','TRIGGER'] loop
    if has_table_privilege(role_name,format('public.%I',t.relname),privilege_name)
    then raise exception 'Excess privilege survived: % % %',role_name,t.relname,privilege_name; end if;
   end loop;
  end loop;
 end loop;
end $test$;
-- Idempotency and future-table defaults for the same migration owner.
\ir ../../supabase/proposals/revoke-legacy-table-privileges.sql
create table public.stabilization_default_probe(id integer);
do $$ begin
 if has_table_privilege('authenticated','public.stabilization_default_probe','TRUNCATE')
 or has_table_privilege('anon','public.stabilization_default_probe','TRUNCATE')
 then raise exception 'Unsafe default privileges'; end if;
end $$;
drop table public.stabilization_default_probe;
select 'legacy non-row grants removed: PASS';
