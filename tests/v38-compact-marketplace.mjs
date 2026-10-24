import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(p,'utf8');
const norm=read('lib/marketplace/smart-search.ts').replace("import type {Service} from './catalog';",'');
const normJs=ts.transpileModule(norm,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const normUrl='data:text/javascript;base64,'+Buffer.from(normJs).toString('base64');
const source=read('lib/marketplace/live-discovery.ts').replace("import {normalizeSearch,searchTokens,typoClose} from './smart-search';","import {normalizeSearch,searchTokens,typoClose} from '"+normUrl+"';");
const transpiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {visibleMarketplaceServices,HOME_PREVIEW_LIMIT,EXPLORE_PAGE_SIZE}=await import('data:text/javascript;base64,'+Buffer.from(transpiled).toString('base64'));
test('homepage shows up to six real results and never stretches a single card',()=>{
 assert.equal(HOME_PREVIEW_LIMIT,6);
 assert.deepEqual(visibleMarketplaceServices([{id:'only'}],true).map(x=>x.id),['only']);
 assert.deepEqual(visibleMarketplaceServices(Array.from({length:100},(_,i)=>({id:String(i)})),true).map(x=>x.id),['0','1','2','3','4','5']);
 assert.deepEqual(visibleMarketplaceServices([],true),[]);
});
test('Explore progressively reveals genuine catalog results without synthetic listings',()=>{
 const many=Array.from({length:37},(_,i)=>({id:'live-'+i}));
 assert.equal(EXPLORE_PAGE_SIZE,12);
 assert.deepEqual(visibleMarketplaceServices(many,false).map(x=>x.id),many.slice(0,12).map(x=>x.id));
 assert.deepEqual(visibleMarketplaceServices(many,false,24).map(x=>x.id),many.slice(0,24).map(x=>x.id));
 assert.equal(visibleMarketplaceServices(many,false,48).length,37);
});
test('real-service home/Explore paths retain favorites, compare, packages and access flow',()=>{
 const c=read('components/live-catalog.tsx');
 const parent=read('components/premium-marketplace.tsx');
 assert.match(parent,/homePreview=\{view==='home'\}/);
 assert.match(c,/marketplace_catalog/);
 assert.match(c,/liveServicePrice\(s\)/);
 assert.match(c,/homePreview\?<div className="v39-card-footer"/);
 assert.match(c,/v39-explore-grid/);
 assert.match(c,/EXPLORE_PAGE_SIZE/);
 assert.match(c,/ServiceComparison/);
 assert.match(c,/onSave\(s\.id\)/);
 assert.match(c,/v23-tier-tabs/);
 assert.match(c,/href=\{'\/listing\/\?id='/);
 assert.doesNotMatch(c,/filtered\.length===1\?'v23-single-listing'/);
});
