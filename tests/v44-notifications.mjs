import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');

test('notification bell remains recipient scoped with realtime and polling fallback',()=>{
 const ui=read('components/global-notifications.tsx');
 assert.match(ui,/db\.channel\('v44-notices-'\+userId\)/);
 for(const table of ['project_notifications','order_notifications','messages']){
  assert.ok(ui.includes("table:'"+table+"'"),table);
 }
 assert.match(ui,/filter:'recipient_id=eq\.'\+userId/);
 assert.match(ui,/db\.removeChannel\(channel\)/);
 assert.match(ui,/window\.setInterval/);
 assert.match(ui,/,45000\)/);
 assert.match(ui,/document\.visibilityState==='visible'/);
 assert.match(ui,/generation\.current\+\+/);
});
test('seller sees seller inbox; buyer sees buyer inbox and role follows account',()=>{
 const ui=read('components/global-notifications.tsx');
 assert.match(ui,/isSeller\?'\/seller-studio\/\?tab=messages':'\/buyer\/\?tab=messages'/);
 assert.match(ui,/item\.source==='chat'\?chatHref:item\.href/);
 assert.match(ui,/href=\{chatHref\}/);
 assert.match(read('components/premium-marketplace.tsx')+read('components/site-header.tsx'),/isSeller=\{notificationsAsSeller\?\?account\.isSeller\}/);
 assert.match(read('components/workspace.tsx'),/notificationsAsSeller=\{entry==='seller'\}/);
});
test('notification interactions preserve read updates, error and accessibility feedback',()=>{
 const ui=read('components/global-notifications.tsx');
 assert.match(ui,/\.eq\('recipient_id',userId\)/);
 assert.match(ui,/\.is\('read_at',null\)/);
 assert.match(ui,/aria-live="polite"/);
 assert.match(ui,/aria-expanded=\{open\}/);
 assert.match(ui,/setRefreshing\(true\)/);
 assert.match(ui,/global-notice-refreshing/);
 assert.match(ui,/event\.key==='Escape'|e\.key==='Escape'/);
 const css=read('app/global-notifications.css');
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/global-notice-read:focus-visible/);
});
