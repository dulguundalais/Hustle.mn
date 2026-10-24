import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const catalog=read('components/live-catalog.tsx');
const shell=read('components/premium-marketplace.tsx');
const detail=read('components/live-listing-detail.tsx');
const css=read('app/v39-creative-cards.css');
test('new catalog separates Homepage showcase from Explore results',()=>{
 assert.match(shell,/homePreview=\{view==='home'\}/);
 assert.match(catalog,/const HOME_COUNT=6/);
 assert.match(catalog,/const START_COUNT=12/);
 assert.match(catalog,/homePreview\?HOME_COUNT:Math\.max\(START_COUNT,count\)/);
 assert.match(catalog,/filtered\.length>visibleCount/);
 assert.match(catalog,/v39-card-grid/);
 assert.doesNotMatch(catalog,/v23-single-listing|v23-service-offer/);
});
test('one seller remains a single normal card and mobile grid scales to one column',()=>{
 assert.match(css,/\.v39-card-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:1060px\)/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/\.v39-talent-card\{position:relative;min-width:0/);
});
test('no fabricated portraits, reviews, earnings, hourly prices or portfolios',()=>{
 assert.match(catalog,/marketplace_catalog/);
 assert.match(catalog,/filterLiveServices\(services/);
 assert.match(catalog,/reviewCount>0&&Number\.isFinite\(rating\)/);
 assert.match(catalog,/liveServicePrice\(s\)/);
 assert.doesNotMatch(catalog,/randomuser\.me|unsplash|placeholder\.com|earnings|\$[0-9]+\/hr/);
 assert.match(read('public/public-profile.css'),/\.portfolio-hero/);
});
test('Favorites, compare and buyer request flow are unchanged',()=>{
 assert.match(catalog,/onSave\(s\.id\)/);
 assert.match(catalog,/onSignInSave\?\.\(\)/);
 assert.match(catalog,/compareSelection/);
 assert.match(catalog,/ServiceComparison/);
 assert.match(catalog,/contactSellerHref\(s\.slug\)/);
 assert.match(detail,/rpc\('marketplace_catalog'\)/);
 assert.match(detail,/&tier=/);
 assert.match(detail,/\/login\/\?mode=buyer&service=/);
 assert.match(detail,/v28-detail-tiers/);
});
test('public seller profile still supports private portfolio signed images and beta-only contact',()=>{
 const publicSource=read('lib/marketplace/public-profile.ts');
 assert.match(publicSource,/public_seller/);
 assert.match(publicSource,/portfolioImage/);
 assert.match(publicSource,/expiresIn:60/);
 assert.match(read('lib/marketplace/public-portfolio-render.ts'),/mode=buyer/);
});
