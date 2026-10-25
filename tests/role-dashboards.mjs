import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const workspace=read('components/workspace.tsx');
test('three dedicated dashboards load the correctly scoped workspace',()=>{
 assert.match(read('app/buyer/page.tsx'),/entry="buyer"/);
 assert.match(read('app/seller-studio/page.tsx'),/entry="seller"/);
 assert.match(read('app/admin/page.tsx'),/entry="admin"/);
});
test('buyer overview only displays own orders',()=>{
 assert.match(workspace,/tab==='buyer-home'/);
 assert.match(workspace,/myOrders=orders.filter\(o=>o.buyer_id===uid\)/);
 assert.match(workspace,/myOrders.slice\(0,4\).map\(orderRow\)/);
});
test('seller incoming orders are separated from buyer orders',()=>{
 assert.match(workspace,/tab==='seller-orders'/);
 assert.match(workspace,/incoming=orders.filter\(o=>o.seller_id===uid\)/);
 assert.match(workspace,/const activeNav=entry==='seller'\?sellerNav:buyerNav/);
});
test('admin remains role-gated with separate entry point',()=>{
 assert.match(workspace,/entry==='admin'&&role!=='admin'/);
 assert.match(workspace,/entry==='admin'&&<>/);
 assert.match(workspace,/href="\/admin\/"/);
});
test('auth redirects to correct buyer/seller/admin route without losing selected seller',()=>{
 assert.match(workspace,/const destination=mode==='seller'\?'\/seller-studio\/'/);
 assert.match(workspace,/next.set\('seller',seller\)/);
 assert.ok(workspace.includes("setChatPeer(contact.sellerId);setTab('messages')"));
});
