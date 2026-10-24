import {test} from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const toUrl=content=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(content,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const tools=readFileSync(new URL('../lib/marketplace/creative-tools.ts',import.meta.url),'utf8');
const toolUrl=toUrl(tools);
const template=readFileSync(new URL('../lib/marketplace/public-portfolio-render.ts',import.meta.url),'utf8')
 .replace("from './creative-tools';","from '"+toolUrl+"';");
const rendererUrl=toUrl(template);
const source=readFileSync(new URL('../lib/marketplace/public-profile.ts',import.meta.url),'utf8')
 .replace("from './public-portfolio-render';","from '"+rendererUrl+"';");
const {publicProfile,portfolioImage}=await import(toUrl(source));
test('public profile escapes user content and emits OG metadata',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>Response.json({display_name:'<script>alert(1)</script>',headline:'" onload="bad',bio:'<img src=x>',slug:'test-seller',portfolio:[],services:[]});
 try{const r=await publicProfile(new Request('https://preview.example/p/test-seller'),'test-seller',{NEXT_PUBLIC_SUPABASE_URL:'https://db.example',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'public'});const html=await r.text();assert.equal(r.status,200);assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(html.includes('property="og:image"'));assert.equal(r.headers.get('Cache-Control'),'no-store');}finally{globalThis.fetch=original;}
});
test('invalid profile and traversal paths are denied before upstream access',async()=>{
 assert.equal((await publicProfile(new Request('https://preview.example'),'../secret',{})).status,404);
 assert.equal((await portfolioImage(new Request('https://preview.example/api?path=../secret'),{})).status,404);
});

test('public seller profile links to live listing and preserves seller contact context',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>Response.json({
   display_name:'QA Studio',headline:'Designer',bio:'Professional creator',slug:'test-freelancer',
   portfolio:[],services:[{id:'20000000-0000-4000-8000-000000000001',title:'Logo',title_en:'Logo',description:'Custom logo',price:100000,delivery_days:5}]
 });
 try{
  const r=await publicProfile(new Request('https://preview.example/p/test-freelancer'),'test-freelancer',{
    NEXT_PUBLIC_SUPABASE_URL:'https://supabase.example',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'
  });
  const html=await r.text();
  assert.equal(r.status,200);
  assert.match(html,/href="\/listing\/\?id=20000000-0000-4000-8000-000000000001"/);
  assert.match(html,/href="\/login\/\?mode=buyer&amp;seller=test-freelancer"/);
  assert.doesNotMatch(html,/\/workspace\/\?service=/);
 }finally{globalThis.fetch=original}
});

const path='043e474d-0479-4402-84ed-893ba82ee054/da3a734b-398e-4d36-9ee1-1edc4d4e5606.png';
const config={NEXT_PUBLIC_SUPABASE_URL:'https://db.example',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'};
test('public opt-in portfolio uses temporary signed URL, never a bare anonymous private download',async()=>{
 const original=globalThis.fetch;
 let requests=[];
 globalThis.fetch=async(url,options={})=>{
  requests.push({url:String(url),options});
  if(requests.length===1)return Response.json({signedURL:'/object/sign/portfolio/'+path+'?token=test-token'});
  return new Response(new Uint8Array([137,80,78,71]),{status:200,headers:{'Content-Type':'image/png'}});
 };
 try{
  const r=await portfolioImage(new Request('https://preview.example/api/portfolio-image?path='+encodeURIComponent(path)),config);
  assert.equal(r.status,302);
  assert.equal(r.headers.get('Cache-Control'),'no-store');
  assert.equal(r.headers.get('Referrer-Policy'),'no-referrer');
  assert.match(r.headers.get('Location')||'',/\/storage\/v1\/object\/sign\/portfolio\//);
  assert.equal(requests.length,1);
  assert.equal(requests[0].options.method,'POST');
  assert.equal(requests[0].options.headers.apikey,config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  assert.equal(requests[0].options.headers.Authorization,undefined);
  assert.equal(JSON.parse(requests[0].options.body).expiresIn,60);

 }finally{globalThis.fetch=original}
});

test('private or revoked portfolio permissions never fall back to public bucket access',async()=>{
 const original=globalThis.fetch;let hits=0;
 globalThis.fetch=async()=>{hits++;return new Response('Forbidden',{status:403})};
 try{
  const r=await portfolioImage(new Request('https://preview.example/api/portfolio-image?path='+encodeURIComponent(path)),config);
  assert.equal(r.status,404);assert.equal(hits,2); // Same anonymous publishable key, no elevated access.
  assert.equal(r.headers.get('X-Hustle-Storage-Status'),'403');
 }finally{globalThis.fetch=original}
});
test('malicious signed URLs cannot make profile proxy fetch another host',async()=>{
 const original=globalThis.fetch;let hits=0;
 globalThis.fetch=async()=>{hits++;return Response.json({signedURL:'https://evil.example/steal?token=secret'})};
 try{
  const r=await portfolioImage(new Request('https://preview.example/api/portfolio-image?path='+encodeURIComponent(path)),config);
  assert.equal(r.status,502);assert.equal(hits,1);
 }finally{globalThis.fetch=original}
});

test('publishable-key Storage signing retries one authentication mismatch without elevated privileges',async()=>{
 const original=globalThis.fetch;let requests=[];
 globalThis.fetch=async(url,options={})=>{
  requests.push({url:String(url),options});
  if(requests.length===1)return new Response('Authorization required',{status:401});
  if(requests.length===2)return Response.json({signedURL:'/object/sign/portfolio/'+path+'?token=public-rls-only'});
  return new Response(new Uint8Array([137,80,78,71]),{status:200,headers:{'Content-Type':'image/png'}});
 };
 try{
  const result=await portfolioImage(new Request('https://preview.example/api/portfolio-image?path='+encodeURIComponent(path)),config);
  assert.equal(result.status,302);
  assert.equal(requests.length,2);
  assert.equal(requests[0].options.headers.Authorization,undefined);
  assert.equal(requests[1].options.headers.Authorization,'Bearer '+config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  assert.equal(requests[1].options.headers.apikey,config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  assert.match(result.headers.get('Location')||'',/token=public-rls-only/);
 }finally{globalThis.fetch=original}
});
test('failed Storage signing includes only safe HTTP status diagnostics',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>new Response('Secret internal failure',{status:503});
 try{
  const result=await portfolioImage(new Request('https://preview.example/api/portfolio-image?path='+encodeURIComponent(path)),config);
  assert.equal(result.status,404);
  assert.equal(result.headers.get('X-Hustle-Storage-Step'),'sign');
  assert.equal(result.headers.get('X-Hustle-Storage-Status'),'503');
  assert.doesNotMatch(await result.text(),/Secret internal/);
 }finally{globalThis.fetch=original}
});
