import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('historic V19 grid rules remain scoped away from the live catalog',()=>{
 const old=read('app/v19-home.css');
 assert.doesNotMatch(old,/\.hustle-v5 \.live-catalog-grid\{/);
 assert.match(old,/\.live-catalog-grid:not\(\.v23-service-grid\)/);
});
test('V39 single listing stays a normal grid cell instead of the huge V23 featured row',()=>{
 const c=read('components/live-catalog.tsx');
 const css=read('app/v39-creative-cards.css');
 assert.match(c,/v39-card-grid/);
 assert.doesNotMatch(c,/v23-single-listing|filtered\.length===1/);
 assert.match(css,/\.v39-card-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:650px\)/);
});
test('homepage has only six featured published services and detailed package selection remains in listing detail',()=>{
 const c=read('components/live-catalog.tsx');
 const parent=read('components/premium-marketplace.tsx');
 const detail=read('components/live-listing-detail.tsx');
 assert.match(c,/const HOME_COUNT=6/);
 assert.match(c,/const START_COUNT=12/);
 assert.match(c,/visibleServices\(filtered,homePreview,visibleCount\)/);
 assert.match(parent,/homePreview=\{view==='home'\}/);
 assert.match(detail,/Basic','Standard','Premium/);
});
