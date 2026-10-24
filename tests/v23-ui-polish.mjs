import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('V39 moves package tabs out of crowded homepage to authentic service details',()=>{
 const card=read('components/live-catalog.tsx');
 const detail=read('components/live-listing-detail.tsx');
 assert.doesNotMatch(card,/v23-tier-tabs/);
 assert.match(detail,/aria-pressed=\{tier===option\}/);
 assert.match(detail,/chosen\?\.delivery_days/);
 assert.match(detail,/chosen\?\.revisions/);
 assert.match(card,/contactSellerHref\(s.slug\)/);
 assert.match(detail,/&tier=/);
 assert.match(card,/review_count/);
});
test('buyer preserves package tier after authentication redirect',()=>{
 const s=read('components/workspace.tsx');
 assert.match(s,/queryParams.get\('tier'\)/);
 assert.match(s,/setSelectedTier\(preferred/);
 assert.match(s,/setTab\('browse'\)/);
 assert.match(s,/function orderCard\(o:Order\)/);
 assert.match(s,/ReviewComposer/);
});
test('legacy order dashboard styles and new card styles remain responsive',()=>{
 const old=read('app/v23-ui-polish.css');
 const newStyle=read('app/v39-creative-cards.css');
 for(const k of ['.v23-order-card','.v23-order-brief','.order-timeline','.review-existing'])assert.ok(old.includes(k),k);
 for(const k of ['v39-talent-card','v39-card-cover','v39-person-avatar','@media(max-width:650px)','prefers-reduced-motion'])assert.ok(newStyle.includes(k),k);
});
test('catalog uses one published RPC and shows verified reviews only',()=>{
 const s=read('components/live-catalog.tsx');
 assert.equal((s.match(/rpc\('marketplace_catalog'\)/g)||[]).length,1);
 assert.match(s,/reviewCount>0&&Number\.isFinite\(rating\)/);
 assert.doesNotMatch(s,/4\.9|1500\+|4\.8.*stars/i);
});
