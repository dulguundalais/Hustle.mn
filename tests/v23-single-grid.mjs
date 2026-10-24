import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('legacy V19 responsive rules never override live marketplace catalog grid',()=>{
 const s=read('app/v19-home.css');
 assert.doesNotMatch(s,/\.hustle-v5 \.live-catalog-grid\{/);
 assert.match(s,/\.live-catalog-grid:not\(\.v23-service-grid\)/);
});
test('single item cannot trigger the old jumbo full-width listing style',()=>{
 const live=read('components/live-catalog.tsx');
 const compact=read('app/v38-compact-marketplace.css');
 assert.doesNotMatch(live,/filtered\.length===1\?'v23-single-listing'/);
 assert.match(live,/v39-home-grid/);
 assert.match(live,/v39-explore-grid/);
 assert.match(compact,/\.live-catalog-grid\.v23-service-grid\.v39-home-grid/);
 assert.match(compact,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(compact,/@media\(max-width:1080px\)/);
 assert.match(compact,/@media\(max-width:660px\)/);
});
test('homepage preview is separated from full service detail and preserves Explore',()=>{
 const page=read('components/premium-marketplace.tsx');
 const live=read('components/live-catalog.tsx');
 assert.match(page,/homePreview=\{view==='home'\}/);
 assert.match(live,/homePreview\?<div className="v39-card-footer"/);
 assert.match(live,/className="v23-service-offer"/);
 assert.match(live,/visibleMarketplaceServices\(filtered,homePreview,visibleCount\)/);
});
