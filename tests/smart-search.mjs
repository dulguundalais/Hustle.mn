import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('lib/marketplace/smart-search.ts').replace("import type {Service} from './catalog';",'');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {normalizeSearch,matchesService,suggestServices}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const demo=[
{id:'brand',mn:'Брэндийн иж бүрэн дизайн, лого',en:'Distinctive brand identity & logo design',seller:'Studio Nomad'},
{id:'video',mn:'Reels, сошиал видео эвлүүлэг',en:'Short-form video editing for social media',seller:'Motion House'},
{id:'translation',mn:'Орчуулга, контент бичих',en:'Translation and copywriting',seller:'Wordsmith'},
{id:'web',mn:'Бизнесийн вебсайт хөгжүүлэлт',en:'Modern business website development',seller:'Code Craft'}
];
test('normalizes Cyrillic, Unicode case and punctuation',()=>{
 assert.equal(normalizeSearch('ЛОГО!'),'logo');
 assert.equal(normalizeSearch('Вэб сайт'),'veb sait');
});
test('finds the same service from English, Cyrillic and romanized Mongolian',()=>{
 for(const word of ['logo','лого','brend'])assert.ok(matchesService(demo[0],word),word);
 for(const word of ['video','видео','video evluuleg'])assert.ok(matchesService(demo[1],word),word);
 for(const word of ['orchuulga','орчуулга','translation'])assert.ok(matchesService(demo[2],word),word);
 for(const word of ['website','сайт','veb'])assert.ok(matchesService(demo[3],word),word);
});
test('empty query shows no suggestions and unrelated query stays empty',()=>{
 assert.deepEqual(suggestServices('  ',demo),[]);
 assert.deepEqual(suggestServices('zzzzzzzzz',demo),[]);
 assert.equal(suggestServices('logo',demo)[0]?.id,'brand');
});
test('the homepage wires smart suggestions to real preview listing links',()=>{
 const ui=read('components/signature-home.tsx');
 assert.match(ui,/suggestLiveServices\(published,search,4\)/);
 assert.match(ui,/id="hero-search-suggestions"/);
 assert.match(read('components/premium-marketplace.tsx'),/matchesService\(s,query\)/);
});
