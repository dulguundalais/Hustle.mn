import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const read=p=>readFileSync(p,'utf8');
const source=read('lib/marketplace/notification-center.ts');
const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
new Function('exports','module',output)(mod.exports,mod);
const {combineNotices,badgeCount}=mod.exports;

const project=[{id:'p1',recipient_id:'buyer',request_id:'r1',kind:'proposal',created_at:'2026-10-23T04:00:00Z',read_at:null},
 {id:'p2',recipient_id:'seller',request_id:'r2',kind:'invitation',created_at:'2026-10-23T01:00:00Z',read_at:'2026-10-23T01:30:00Z'}];
const order=[{id:'o1',recipient_id:'buyer',order_id:'order1',kind:'delivered',created_at:'2026-10-23T03:00:00Z',read_at:null}];
const messages=[{id:'m1',sender_id:'seller',recipient_id:'buyer',created_at:'2026-10-23T02:00:00Z',read_at:null},
 {id:'m2',sender_id:'seller',recipient_id:'buyer',created_at:'2026-10-23T02:15:00Z',read_at:null}];

test('unified bell groups chat threads without losing unread message totals',()=>{
 const found=combineNotices(project,order,messages);
 assert.equal(found.unread,4);
 assert.equal(found.chatUnread,2);
 assert.equal(found.projectUnread,1);
 assert.equal(found.orderUnread,1);
 assert.equal(found.items.filter(n=>n.source==='chat').length,1);
 const chat=found.items.find(n=>n.source==='chat');
 assert.equal(chat.count,2);
 assert.equal(chat.href,'/buyer/?tab=messages');
 assert.equal(found.items[0].source,'project');
 assert.equal(found.items[1].source,'order');
});
test('notifications link to intended role dashboards and retain read state',()=>{
 const found=combineNotices(project,order,[]);
 assert.equal(found.items.find(n=>n.kind==='proposal').href,'/project-requests/');
 assert.equal(found.items.find(n=>n.kind==='invitation').href,'/seller-requests/');
 assert.equal(found.items.find(n=>n.kind==='delivered').href,'/buyer/?tab=orders');
 assert.equal(found.items.find(n=>n.kind==='invitation').read,true);
 assert.equal(badgeCount(0),'0');
 assert.equal(badgeCount(199),'99+');
});
test('global bell uses only signed-in recipient RLS and read_at writes',()=>{
 const s=read('components/global-notifications.tsx');
 assert.match(s,/\.eq\('recipient_id',userId\)/);
 assert.match(s,/\.is\('read_at',null\)/);
 assert.match(s,/db\.from\('project_notifications'\)/);
 assert.match(s,/db\.from\('order_notifications'\)/);
 assert.match(s,/db\.from\('messages'\)/);
 assert.match(s,/\.update\(\{read_at:/);
 assert.doesNotMatch(s,/service_role|secret_key|create table/i);
 const home=read('components/premium-marketplace.tsx');
 assert.match(home,/sessionState==='signed-in'&&account&&<GlobalNotifications/);
 const dashboard=read('components/workspace.tsx');
 assert.match(dashboard,/uid&&role&&<GlobalNotifications/);
 assert.match(dashboard,/params\.get\('tab'\)==='messages'/);
 assert.match(dashboard,/params\.get\('tab'\)==='orders'/);
 assert.match(dashboard,/params\.get\('tab'\)==='seller-orders'/);
});
