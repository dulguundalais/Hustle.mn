import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('V23 public listing has accessible package tabs and displayed selected metrics',()=>{
 const s=read('components/live-catalog.tsx');
 assert.match(s,/aria-pressed=\{choice===tier\}/);
 assert.match(s,/const price=picked\?\.price\?\?s\.price/);
 assert.match(s,/const days=picked\?\.delivery_days\?\?s\.delivery_days/);
 assert.match(s,/const revisions=picked\?\.revisions\?\?s\.revisions/);
 assert.match(s,/contactSellerHref\(s.slug\)/);
 assert.match(s,/&tier=/);
 assert.match(s,/review_count/);
});
test('V23 buyer preserves selected tier after auth redirect',()=>{
 const s=read('components/workspace.tsx');
 assert.match(s,/queryParams.get\('tier'\)/);
 assert.match(s,/setSelectedTier\(preferred/);
 assert.match(s,/setTab\('browse'\)/);
 assert.match(s,/function orderCard\(o:Order\)/);
 assert.match(s,/ReviewComposer/);
});
test('V23 CSS enforces legible order and marketplace type and mobile adaptability',()=>{
 const s=read('app/v23-ui-polish.css');
 for(const k of ['.v23-service-card','.v23-order-card','.v23-order-brief','.order-timeline','.review-existing','.v23-tier-tabs','@media(max-width:660px)'])assert.ok(s.includes(k),k);
 assert.match(s,/font-size:16px/);
});
test('V23 keeps a single live-catalog RPC and no invented ratings',()=>{
 const s=read('components/live-catalog.tsx');
 assert.equal((s.match(/rpc\('marketplace_catalog'\)/g)||[]).length,1);
 assert.match(s,/review_count\)\|\|0/);
 assert.doesNotMatch(s,/4\.9|1500\+|4\.8.*stars/i);
});
