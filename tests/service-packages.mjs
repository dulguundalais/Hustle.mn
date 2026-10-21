import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import ts from 'typescript';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('components/service-packages.tsx').replace(/^'use client';/,'').replace(/import .* from 'react';/g,'').replace(/import .* from 'lucide-react';/g,'').replace(/import type .* from '\.\.\/lib\/marketplace\/types';/g,'').replace(/import '\.\.\/app\/service-packages.css';/g,'');
const js=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.Preserve,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
// Isolate non-React business logic for a real runtime test, not only static checks.
const logic=js.slice(js.indexOf('export const tiers'),js.indexOf('export function PackageEditor'));
const {initialPackages,checkPackages}=await import('data:text/javascript;base64,'+Buffer.from(logic).toString('base64'));
const basic={service_id:'123',tier:'Basic',name:'Starter',summary:'Simple',price:10000,delivery_days:5,revisions:1,includes:['Logo']};
const standard={...basic,tier:'Standard',name:'Growth',price:30000,includes:['Logo','Sources']};
const premium={...basic,tier:'Premium',name:'Complete',price:50000,includes:['Logo','Sources','Guidelines']};
test('requires exact Basic, Standard and Premium with authored deliverables',()=>{
 assert.equal(checkPackages([basic,standard,premium]),null);
 assert.match(checkPackages([basic,basic,premium]),/three packages/);
 assert.match(checkPackages([basic,{...standard,includes:[]},premium]),/Standard/);
 assert.match(checkPackages([basic,{...standard,price:50001},premium]),/Basic/);
});
test('existing service gets actual Basic price without fabricating other prices',()=>{
 const old={id:'123',price:150000,delivery_days:8,revisions:3};
 const packs=initialPackages(old,[]);
 assert.equal(packs[0].price,150000);
 assert.equal(packs[1].price,0);assert.equal(packs[2].price,0);
 assert.deepEqual(packs.map(x=>x.tier),['Basic','Standard','Premium']);
});
test('database owns order pricing and immutable package snapshots',()=>{
 const sql=read('supabase/migrations/20261021170000_v17_service_packages.sql');
 assert.match(sql,/new.quoted_price=pkg.price/);
 assert.match(sql,/new.included_features=pkg.includes/);
 assert.match(sql,/new.included_features is distinct from old.included_features/);
 assert.match(sql,/security invoker/);
 assert.match(sql,/row level security/);
 assert.match(sql,/status='published'/);
});
test('UI connects all tiers with atomic save and buyer selection',()=>{
 const ui=read('components/workspace.tsx');
 assert.match(ui,/rpc\('save_service_with_packages'/);
 assert.match(ui,/package_name:packageName/);
 assert.match(ui,/<PackageEditor/);
 assert.match(ui,/<PackagePicker/);
 const publicUi=read('components/live-catalog.tsx');
 assert.match(publicUi,/Compare packages/);
 assert.match(publicUi,/View Basic \/ Standard \/ Premium/);
});
