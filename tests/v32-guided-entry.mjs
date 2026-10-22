import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=ts.transpileModule(read('lib/marketplace/guided-entry.ts'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {guidedGoals,guidedProblem,guidedFinderHref}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));

test('personal and business have distinct goals with no account split',()=>{
 assert.equal(guidedGoals.personal.length,6);
 assert.equal(guidedGoals.business.length,6);
 assert.ok(guidedGoals.business.some(x=>x.key==='automation'));
 assert.ok(guidedGoals.personal.some(x=>x.key==='design'));
});
test('user can skip typing and take a contextual example',()=>{
 const g=guidedGoals.business[0];
 assert.equal(guidedProblem(g,' ',false),g.exampleMn);
 assert.equal(guidedProblem(g,' ',true),g.exampleEn);
 assert.equal(guidedProblem(g,' Манай захиалга бага ',false),'Манай захиалга бага');
});
test('optional brief parameters never gate the buyer experience',()=>{
 const g=guidedGoals.business[0];
 const url=new URL(guidedFinderHref('business',g,'',false),'https://example.test');
 assert.equal(url.searchParams.get('audience'),'business');
 assert.equal(url.searchParams.get('budget'),null);
 const custom=new URL(guidedFinderHref('business',g,'Facebook zahialga automataar avmaar baina',false,'500000 MNT','2 weeks'),'https://example.test');
 assert.equal(custom.searchParams.get('budget'),'500000 MNT');
 assert.equal(custom.searchParams.get('timeline'),'2 weeks');
});
test('the homepage uses a two-step route with inline published listing links',()=>{
 const hero=read('components/signature-home.tsx');
 const guide=read('components/guided-entry.tsx');
 assert.match(hero,/<GuidedEntry en=\{en\}\/>/);
 assert.match(guide,/type Screen='choose'\|'results'/);
 assert.match(guide,/onClick=\{\(\)=>choose\(item\)\}/);
 assert.match(guide,/matchingPublished\(catalog,solution,2\)/);
 assert.match(guide,/rpc\('marketplace_catalog'\)/);
 assert.match(guide,/\/listing\/\?id=/);
 assert.match(guide,/role="dialog" aria-modal="true"/);
 assert.match(guide,/event\.key==='Escape'/);
 assert.match(guide,/event\.key!=='Tab'/);
 assert.match(guide,/detailsOpen&&/);
 assert.doesNotMatch(guide,/setStep\(3\)/);
});
