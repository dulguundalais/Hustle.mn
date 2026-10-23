import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migration=readFileSync('supabase/migrations/20261023150000_v34_project_notifications.sql','utf8');
const project=readFileSync('components/project-matching.tsx','utf8');
const css=readFileSync('app/project-matching.css','utf8');

test('V34 stores events under RLS and only recipients can read or mark read',()=>{
 assert.match(migration,/create table if not exists public\.project_notifications/);
 assert.match(migration,/alter table public\.project_notifications enable row level security/);
 assert.match(migration,/revoke all on public\.project_notifications from public,anon,authenticated/);
 assert.match(migration,/grant select on public\.project_notifications to authenticated/);
 assert.match(migration,/grant update\(read_at\) on public\.project_notifications to authenticated/);
 assert.doesNotMatch(migration,/grant (insert|delete|update on) on public\.project_notifications to authenticated/i);
 assert.match(migration,/for select to authenticated using \(\s*recipient_id=\(select auth\.uid\(\)\)/);
 assert.match(migration,/for update to authenticated using \(\s*recipient_id=\(select auth\.uid\(\)\)/);
 assert.match(migration,/with check \(\s*recipient_id=\(select auth\.uid\(\)\)/);
});
test('V34 project events are created only by private triggers, no external email sending',()=>{
 for(const kind of ['invitation','proposal','awarded','cancelled']){
  assert.match(migration,new RegExp("'"+kind+"'"));
 }
 assert.match(migration,/create schema if not exists hustle_private/);
 assert.match(migration,/revoke all on schema hustle_private from public,anon,authenticated/);
 assert.match(migration,/security definer set search_path=''/);
 assert.match(migration,/after insert on public\.project_invitations/);
 assert.match(migration,/after insert on public\.project_proposals/);
 assert.match(migration,/after update of status on public\.project_proposals/);
 assert.match(migration,/after update of status on public\.project_requests/);
 assert.match(migration,/unique\(recipient_id,kind,source_id\)/);
});
test('V34 buyer management and seller alerts have participant-scoped client updates',()=>{
 assert.match(project,/db\.from\('project_notifications'\)/);
 assert.match(project,/\.eq\('recipient_id',current\.id\)/);
 assert.match(project,/\.update\(\{read_at:/);
 assert.match(project,/\.eq\('recipient_id',user\)/);
 assert.match(project,/setStatusFilter/);
 assert.match(project,/setOfferSort/);
 assert.match(project,/invite_status==='declined'/);
 assert.match(css,/project-notification/);
});
