import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('public listings use only published consent-aware RPC',()=>{
 const source=read('components/live-catalog.tsx');
 assert.match(source,/rpc\('marketplace_catalog'\)/);
 assert.match(source,/contactSellerHref\(s.slug,signedIn\)/);
 assert.doesNotMatch(source,/from\('services'\)/);
});
test('return path preserves seller context through auth to messages',()=>{
 const ui=read('components/workspace.tsx');
 assert.match(ui,/params.get\('seller'\)/);
 assert.ok(ui.includes("setChatPeer(contact.sellerId);setTab('messages')"));
 assert.match(ui,/next.set\('seller',seller\)/);
});
test('admin access is gated and seller entry exists',()=>{
 const ui=read('components/workspace.tsx');
 assert.match(ui,/entry==='admin'&&role!=='admin'/);
 assert.match(ui,/activeNav\.map\(/);
 assert.match(read('app/admin/page.tsx'),/entry="admin"/);
 assert.match(read('app/join/seller/page.tsx'),/entry="seller"/);
});
