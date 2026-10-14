import {test} from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../lib/marketplace/public-profile.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {publicProfile,portfolioImage}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('public profile escapes user content and emits OG metadata',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>Response.json({display_name:'<script>alert(1)</script>',headline:'" onload="bad',bio:'<img src=x>',slug:'test-seller',portfolio:[],services:[]});
 try{const r=await publicProfile(new Request('https://preview.example/p/test-seller'),'test-seller',{NEXT_PUBLIC_SUPABASE_URL:'https://db.example',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'public'});const html=await r.text();assert.equal(r.status,200);assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(html.includes('property="og:image"'));assert.equal(r.headers.get('Cache-Control'),'no-store');}finally{globalThis.fetch=original;}
});
test('invalid profile and traversal paths are denied before upstream access',async()=>{
 assert.equal((await publicProfile(new Request('https://preview.example'),'../secret',{})).status,404);
 assert.equal((await portfolioImage(new Request('https://preview.example/api?path=../secret'),{})).status,404);
});
