import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=path=>readFileSync(path,'utf8');
const load=source=>import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const savedSource=read('lib/marketplace/use-saved-services.ts');
const cmpSource=read('components/service-comparison.tsx');
const {validServiceId}=await load(savedSource.match(/export const validServiceId = [\s\S]*?\.test\(id\);/)?.[0]||'export const validServiceId=()=>false;');
const {compareSelection,compareLimit}=await load('export const compareLimit=3;'+cmpSource.match(/export function compareSelection\([\s\S]*?\n\}/)?.[0]);
const id='aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
test('favorites accepts UUIDs only, rejecting demo editorial keys and unsafe input',()=>{
 assert.equal(validServiceId(id),true);
 for(const bad of ['brand','demo','1','',"' OR 1=1",'a'.repeat(99)])assert.equal(validServiceId(bad),false);
});
test('compare selection has at most three unique items and supports removal',()=>{
 assert.equal(compareLimit,3);
 assert.deepEqual(compareSelection([],id),[id]);
 assert.deepEqual(compareSelection([id],id),[]);
 assert.deepEqual(compareSelection(['a','b','c'],'d'),['a','b','c']);
 assert.deepEqual(compareSelection(['a','b'],'b'),['a']);
});
test('V37 reuses existing saved_services table and never uses demo catalog for comparisons',()=>{
 assert.match(savedSource,/from\('saved_services'\)/);
 assert.match(savedSource,/\.eq\('user_id',user\.id\)/);
 assert.match(savedSource,/if\(!id\|\|!validServiceId/);
 assert.match(cmpSource,/services\.find\(s=>s\.id===id\)/);
 assert.match(cmpSource,/\/listing\/\?id=/);
 assert.doesNotMatch(cmpSource,/from ['"]\.\.\/lib\/marketplace\/catalog['"]/);
});
test('account favorites and compare are integrated with live listings and buyer dashboard',()=>{
 const page=read('components/premium-marketplace.tsx');
 const live=read('components/live-catalog.tsx');
 const workspace=read('components/workspace.tsx');
 assert.match(page,/useSavedServices\(\)/);
 assert.match(page,/saved=\{favorites\.saved\}/);
 assert.match(live,/ServiceComparison/);
 assert.match(live,/compared\.length>=compareLimit/);
 assert.match(workspace,/\/explore\/\?saved=1/);
 assert.doesNotMatch(page,/localStorage\.setItem\('hustle-saved',JSON\.stringify\(saved\)\)/);
});
