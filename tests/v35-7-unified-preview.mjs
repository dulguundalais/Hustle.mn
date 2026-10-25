import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const file=(name)=>readFileSync(name,'utf8');
const home=file('components/premium-marketplace.tsx');
const workspace=file('components/workspace.tsx');
const matching=file('components/project-matching.tsx');

test('canonical beta integration keeps homepage bell and chat confirmation together',()=>{
 assert.match(home,/GlobalNotifications/);
 assert.match(workspace,/GlobalNotifications/);
 assert.match(workspace,/stageChatFile\(file\)/);
 assert.match(workspace,/pendingChatFile/);
 assert.match(workspace,/setPendingChatFile\(null\)/);
 assert.match(workspace,/await attachFile\(file,recipient\)/);
 assert.doesNotMatch(workspace,/if\(file\)void attachFile\(file\)/);
 assert.match(workspace,/e\.nativeEvent\.isComposing/);
});

test('retains merged UX and verified V34/V35 project + order features',()=>{
 assert.match(workspace,/safePostLoginPath/);
 assert.match(matching,/signInWithReturn/);
 assert.match(matching,/projectDraftKey/);
 assert.match(matching,/proposalDraftKey/);
 assert.match(matching,/project_notifications/);
 assert.match(matching,/withdraw_project_proposal/);
 assert.match(matching,/sortedOffers/);
 assert.match(workspace,/order_notifications/);
 assert.match(workspace,/renderOrderNotifications/);
});

test('keeps source and regression tests for private beta migrations',()=>{
 for(const p of [
 'supabase/migrations/20261023060757_v34_project_notifications.sql',
 'supabase/migrations/20261023062451_v35_order_collaboration.sql',
 'tests/sql/v34-notification-actors.sql',
 'tests/sql/v35-collaboration-actors.sql',
 'tests/v35-4-global-notifications.mjs',
 'tests/v35-6-chat-file-confirmation.mjs',
 'docs/BETA-PREVIEW-INTEGRATION.md'
 ])assert.ok(existsSync(p),p);
});
