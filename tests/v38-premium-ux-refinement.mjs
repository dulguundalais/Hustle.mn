import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
test('shared UX stylesheet is scoped, responsive and accessible',()=>{
 const root=read('app/layout.tsx');
 const css=read('app/v38-ux-foundation.css');
 assert.match(root,/v38-ux-foundation\.css/);
 for(const key of ['.hustle-v5.workspace','.hustle-v5 .live-catalog','.project-marketplace','.ux-choice-grid','.ux-project-steps','focus-visible','prefers-reduced-motion'])assert.ok(css.includes(key),key);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.doesNotMatch(css,/html\s*\{|body\s*\{/);
});
test('buyer dashboard retains existing actions and makes two primary choices explicit',()=>{
 const ws=read('components/workspace.tsx');
 for(const href of ['/explore/','/explore/?saved=1','/project-requests/'])assert.ok(ws.includes(href),href);
 assert.match(ws,/ux-choice-grid/);
 assert.match(ws,/ux-quick-actions/);
 assert.match(ws,/GlobalNotifications/);
 assert.match(ws,/setPendingChatFile/);
 assert.match(ws,/pendingChatFile/);
});
test('search states distinguish empty catalog from no filter results and show loading skeletons',()=>{
 const live=read('components/live-catalog.tsx');
 assert.match(live,/services\.length===0/);
 assert.match(live,/onlySaved\?t\(/);
 assert.match(live,/ux-loading-tiles/);
 assert.match(live,/filterLiveServices\(services/);
 assert.match(live,/ServiceComparison/);
 assert.match(live,/onSignInSave/);
});
test('project request keeps consent-based flow and gains non-invasive three-step guide',()=>{
 const p=read('components/project-matching.tsx');
 assert.match(p,/ux-project-steps/);
 assert.match(p,/mode==='buyer'/);
 assert.match(p,/submitRequest/);
 assert.match(p,/project-consent/);
 assert.match(p,/project_notifications/);
});
