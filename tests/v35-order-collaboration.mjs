import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=p=>readFileSync(p,'utf8');
const sql=load('supabase/migrations/20261023180000_v35_order_collaboration.sql');
const ui=load('components/project-matching.tsx');
const workspace=load('components/workspace.tsx');
test('V35 owner-safe withdrawal locks request before proposal and rejects awarded project',()=>{
 assert.match(sql,/create or replace function public\.withdraw_project_proposal/);
 assert.match(sql,/where id=v_request_id for update/);
 assert.match(sql,/where id=p_proposal_id[\s\S]*for update/);
 assert.match(sql,/v_request\.status<>'open'/);
 assert.match(sql,/v_proposal\.status<>'pending'/);
 assert.match(sql,/p_proposal_id uuid/);
 assert.match(sql,/grant execute on function public\.withdraw_project_proposal\(uuid\) to authenticated/);
 assert.match(sql,/status='withdrawn'/);
});
test('V35 order events are recipient-only, no anonymous or direct client insert',()=>{
 assert.match(sql,/create table if not exists public\.order_notifications/);
 assert.match(sql,/alter table public\.order_notifications enable row level security/);
 assert.match(sql,/revoke all on public\.order_notifications from public,anon,authenticated/);
 assert.match(sql,/grant update\(read_at\) on public\.order_notifications to authenticated/);
 assert.match(sql,/recipient_id=\(select auth\.uid\(\)\)/);
 assert.match(sql,/create trigger v35_order_notification after insert or update of status on public\.orders/);
 assert.match(sql,/revision_requested/);
 assert.match(sql,/security definer set search_path=''/);
});
test('V35 project collaboration shows chat and edit/withdraw actions',()=>{
 assert.match(ui,/withdraw_project_proposal/);
 assert.match(ui,/openProposal\(inv/);
 assert.match(ui,/\/buyer\/\?seller=/);
 assert.match(ui,/offer\.status==='pending'/);
});
test('V35 dashboards expose participant-only order notifications and allow marking read',()=>{
 assert.match(workspace,/from\('order_notifications'\)/);
 assert.match(workspace,/\.eq\('recipient_id',uid\)/);
 assert.match(workspace,/\.update\(\{read_at:/);
 assert.match(workspace,/orderNotifications/);
});
