import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=ts.transpileModule(read('lib/marketplace/guided-entry.ts'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {guidedGoals,guidedIndustries,guidedProblem,guidedFinderHref}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));

test('business and personal journeys have six tailored goals without splitting accounts',()=>{
 assert.equal(guidedGoals.personal.length,6);
 assert.equal(guidedGoals.business.length,6);
 assert.notDeepEqual(guidedGoals.personal.map(x=>x.key),guidedGoals.business.map(x=>x.key));
 assert.ok(guidedGoals.business.some(x=>x.key==='automation'));
 assert.ok(guidedGoals.personal.some(x=>x.key==='design'));
});
test('empty description uses a useful bilingual goal example; entered needs win',()=>{
 const goal=guidedGoals.business[0];
 assert.equal(guidedProblem(goal,' ',false),goal.exampleMn);
 assert.equal(guidedProblem(goal,' ',true),goal.exampleEn);
 assert.equal(guidedProblem(goal,'  Надад захиалга нэмэх хэрэгтэй байна  ',false),'Надад захиалга нэмэх хэрэгтэй байна');
});
test('real Finder handoff transports context, goals, budget and timeline',()=>{
 const goal=guidedGoals.business[1];
 const href=guidedFinderHref('business',goal,'Facebook zahialgiig automataar burtgeh',false,'500,000 ₮','14 хоног');
 const url=new URL(href,'https://qa.example');
 assert.equal(url.pathname,'/solutions/');
 assert.equal(url.searchParams.get('audience'),'business');
 assert.equal(url.searchParams.get('q'),'Facebook zahialgiig automataar burtgeh');
 assert.equal(url.searchParams.get('budget'),'500,000 ₮');
 assert.equal(url.searchParams.get('timeline'),'14 хоног');
 assert.ok(guidedIndustries.some(x=>x.value==='restaurant'));
});
test('blank optional parameters do not clutter the discovery URL',()=>{
 const url=new URL(guidedFinderHref('personal',guidedGoals.personal[0],'',false),'https://qa.example');
 assert.equal(url.searchParams.get('audience'),'personal');
 assert.equal(url.searchParams.get('budget'),null);
 assert.ok(url.searchParams.get('q').includes('лого'));
});
test('new homepage has accessible nonblocking two-path entry and a usable three-step modal',()=>{
 const hero=read('components/signature-home.tsx');
 const guide=read('components/guided-entry.tsx');
 assert.match(hero,/import GuidedEntry from '\.\/guided-entry'/);
 assert.match(hero,/<GuidedEntry en=\{en\}\/>/);
 assert.match(guide,/onClick=\{\(\)=>start\('personal'\)\}/);
 assert.match(guide,/onClick=\{\(\)=>start\('business'\)\}/);
 assert.match(guide,/role="dialog" aria-modal="true"/);
 assert.match(guide,/event\.key==='Escape'/);
 assert.match(guide,/event\.key!=='Tab'/);
 assert.match(guide,/guidedFinderHref\(audience,goal,problem,en,budget,timeline\)/);
 assert.match(read('components/solution-finder.tsx'),/params\.get\('budget'\)/);
});
