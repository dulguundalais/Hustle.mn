import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = p => readFileSync(p, 'utf8');
const m = read('supabase/migrations/20261025030000_v47_chat_safety.sql');
const ui = read('components/chat-safety.tsx');
const w = read('components/workspace.tsx');

test('blocks are private to the blocker and stop messages in both directions', () => {
  assert.match(m, /create table public\.user_blocks/);
  assert.match(m, /create policy user_blocks_owner_read[\s\S]+?using \(blocker_id = \(select auth\.uid\(\)\)/);
  assert.match(m, /grant insert \(blocker_id, blocked_id\) on public\.user_blocks to authenticated/);
  assert.match(m, /b\.blocker_id = new\.recipient_id and b\.blocked_id = new\.sender_id/);
  assert.match(m, /b\.blocker_id = new\.sender_id and b\.blocked_id = new\.recipient_id/);
  assert.match(m, /create trigger message_safety_guard before insert on public\.messages/);
});

test('message rate limits are enforced in the database, admins excepted', () => {
  assert.match(m, /interval '1 minute'\) >= 15/);
  assert.match(m, /interval '1 hour'\) >= 150/);
  assert.match(m, /having min\(m\.created_at\) > now\(\) - interval '24 hours'/);
  assert.match(m, /if v_admin then return new; end if;/);
  for (const hint of ['hx_blocked', 'hx_rate_minute', 'hx_rate_hour', 'hx_rate_new']) {
    assert.match(m, new RegExp("hint = '" + hint + "'"));
    assert.match(ui, new RegExp("case '" + hint + "'"));
  }
  assert.match(m, /revoke all on function hustle_private\.message_safety_guard\(\) from public, anon, authenticated/);
});

test('reports are scoped, deduplicated, immutable and reviewed only by admins', () => {
  assert.match(m, /m\.sender_id = reported_id and m\.recipient_id = \(select auth\.uid\(\)\)/);
  assert.match(m, /create unique index message_reports_one_open_per_message/);
  assert.match(m, /grant update \(status, admin_note\) on public\.message_reports to authenticated/);
  assert.match(m, /raise exception 'Report details are immutable'/);
  assert.match(m, /using \(\(select public\.beta_role\(\)\) = 'admin'\) with check \(\(select public\.beta_role\(\)\) = 'admin'\)/);
  assert.match(m, /public\.beta_role\(\) is distinct from 'admin' then\s+raise exception 'Admin only' using errcode = '42501'/);
  assert.match(m, /revoke all on function public\.admin_message_reports\(text\) from public, anon/);
});

test('migration is additive only', () => {
  assert.doesNotMatch(m, /\bdrop\s+(table|policy|function|trigger|column)\b/i);
  assert.doesNotMatch(m, /\balter\s+policy\b/i);
  assert.doesNotMatch(m, /\bdelete\s+from\b/i);
});

test('workspace wires block, report, blocked composer, admin queue and friendly errors', () => {
  assert.match(w, /from '\.\/chat-safety'/);
  assert.match(w, /const chatBlocks=useChatBlocks\(uid\)/);
  assert.match(w, /const safety=chatSafetyMessage\(e,en\);if\(safety\)\{setError\(safety\);return;\}/);
  assert.match(w, /<ChatSafetyActions uid=\{uid\} peerId=\{chatPeer\}/);
  assert.match(w, /chatBlocks\.blocked\.includes\(chatPeer\)\?<BlockedComposer/);
  assert.match(w, /tab==='admin'&&role==='admin'&&<><AdminChatReports/);
  assert.match(ui, /db\.from\('user_blocks'\)\.insert\(\{blocker_id: uid, blocked_id: peer\}\)/);
  assert.match(ui, /db\.rpc\('admin_message_reports', \{p_status: filter\}\)/);
  assert.match(ui, /db\.rpc\('manage_beta', \{target_email: report\.reported_email, target_role: 'member', target_enabled: false\}\)/);
});
