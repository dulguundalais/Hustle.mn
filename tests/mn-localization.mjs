import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(p,'utf8');
const moduleFrom=async text=>import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const source=read('components/service-packages.tsx');
const packages=await moduleFrom(source.slice(source.indexOf('export const tiers'),source.indexOf('export function PackageEditor')));
const labels=await moduleFrom(read('lib/marketplace/ui-labels.ts'));
const {friendlyError}=await moduleFrom(read('lib/marketplace/friendly-errors.ts'));
const valid=()=>['Basic','Standard','Premium'].map((tier,i)=>({tier,name:tier,summary:'Custom work',price:(i+1)*10000,delivery_days:7,revisions:2,includes:['Authored deliverable']}));

test('MN package validation covers every boundary while English and persisted tiers stay intact',()=>{
 const cases=[p=>p.pop(),p=>p[0].name='x',p=>p[1].price=999,p=>p[1].delivery_days=366,p=>p[2].revisions=-1,p=>p[0].includes=[],p=>p[1].price=100000];
 assert.equal(packages.checkPackages(valid(),false),null);
 for(const invalid of cases){const values=valid();invalid(values);const snapshot=JSON.stringify(values);const mn=packages.checkPackages(values,false),en=packages.checkPackages(values,true);assert.match(mn,/[А-ЯӨҮа-яөү]/);assert.doesNotMatch(mn,/Basic|Standard|Premium/);assert.match(en,/[A-Za-z]/);assert.doesNotMatch(en,/[А-ЯӨҮа-яөү]/);assert.equal(JSON.stringify(values),snapshot);}
 assert.deepEqual(packages.tiers,['Basic','Standard','Premium']);
 assert.equal(packages.tierLabel('Premium',false),'Дээд');
 assert.equal(packages.tierLabel('Premium',true),'Premium');
 assert.equal(packages.tierLabel('My authored package',false),'My authored package');
});
test('new package defaults follow locale without changing stored seller content',()=>{
 assert.deepEqual(packages.initialPackages(null,[],false)[0].includes,['Үндсэн үйлчилгээ']);
 const stored=valid().map(p=>({...p,service_id:'service'}));const snapshot=JSON.stringify(stored);
 assert.deepEqual(packages.initialPackages({id:'service'},stored,false),stored);
 assert.equal(JSON.stringify(stored),snapshot);
});
test('known role and project states have MN labels and preserve EN identifiers',()=>{
 for(const role of ['member','partner','admin']){assert.match(labels.roleLabel(role,false),/[А-ЯӨҮа-яөү]/);assert.equal(labels.roleLabel(role,true),role);}
 for(const state of ['open','pending','awarded','declined','withdrawn','cancelled']){assert.match(labels.projectStatusLabel(state,false),/[А-ЯӨҮа-яөү]/);assert.equal(labels.projectStatusLabel(state,true),state);}
 assert.equal(labels.projectStatusLabel('future-state',false),'future-state');
});
test('project failures use safe bilingual errors without leaking SQL details',()=>{
 const error={code:'XX000',message:'private_table internal SQL diagnostic'};
 assert.equal(friendlyError(error,false),'Үйлдэл амжилтгүй боллоо. Дахин оролдоно уу.');
 assert.equal(friendlyError(error,true),'Something went wrong. Please try again.');
 assert.match(friendlyError({message:'Invalid project details'},false),/Төслийн мэдээллээ/);
 assert.match(friendlyError({code:'23505'},false),/бүртгэлтэй/);
});
