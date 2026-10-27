import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
test('release guide uses canonical beta branch alias, never immutable/root host',()=>{
 const guide=read('docs/BETA-PREVIEW-INTEGRATION.md');
 assert.match(guide,/Always use and share:\*\* https:\/\/feature-interactive-function\.hustle-mn-preview\.pages\.dev/);
 assert.match(guide,/Supabase JS stores authentication in browser storage scoped to each origin/);
 assert.match(guide,/configured production branch is \`feature\/homepage-ui-v1\`/);
 assert.match(guide,/sign in there once/);
});
test('homepage global notification bell remains available to a signed-in user and not an anonymous guest',()=>{
 const home=read('components/premium-marketplace.tsx')+read('components/site-header.tsx');
 assert.match(home,/import GlobalNotifications from '\.\/global-notifications'/);
 assert.match(home,/sessionState==='signed-in'&&account&&<GlobalNotifications/);
 assert.match(home,/db\.auth\.getUser\(\)/);
 assert.match(home,/db\.auth\.onAuthStateChange/);
 assert.match(home,/setSessionState\('signed-in'\)/);
});
test('inbox fetch is scoped to authenticated recipient and real order/project/chat records',()=>{
 const inbox=read('components/global-notifications.tsx');
 assert.match(inbox,/\.eq\('recipient_id',userId\)/);
 assert.match(inbox,/db\.from\('project_notifications'\)/);
 assert.match(inbox,/db\.from\('order_notifications'\)/);
 assert.match(inbox,/db\.from\('messages'\)/);
 assert.doesNotMatch(inbox,/service_role/);
});
