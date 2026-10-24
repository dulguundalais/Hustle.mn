import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(p,'utf8');
const urlOf=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const toolsSource=read('lib/marketplace/creative-tools.ts');
const toolsUrl=urlOf(toolsSource);
const {CREATIVE_TOOLS,brandLogoFor}=await import(toolsUrl);
const source=read('lib/marketplace/public-portfolio-render.ts').replace("from './creative-tools';","from '"+toolsUrl+"';");
const {renderPublicSellerPage}=await import(urlOf(source));
const names=['figma','autocad','vscode','react','supabase','after-effects','excel','powerbi'];
test('each supported program has a local, complete SVG brand asset',()=>{
 assert.equal(CREATIVE_TOOLS.length,22);
 for(const tool of CREATIVE_TOOLS){
  const path=brandLogoFor(tool.key);
  assert.equal(path,'/tool-logos/'+tool.key+'.svg');
  assert.ok(existsSync('public'+path),tool.key+' is missing asset');
  const svg=read('public'+path).trim();
  assert.match(svg,/^<svg\b/);
  assert.match(svg,/<\/svg>$/);
  assert.doesNotMatch(svg,/<script\b|<foreignObject\b|onload\s*=|<iframe\b/i);
 }
 assert.equal(brandLogoFor('bad/../link'),undefined);
 assert.equal(brandLogoFor('random-seller-tool'),undefined);
 for(const tool of names)assert.ok(brandLogoFor(tool));
});
test('public portfolio shows brand marks rather than generic Lucide as primary tool identity',()=>{
 const profile={display_name:'Example Seller',headline:'Digital freelancer',bio:'Portfolio',slug:'example-seller',skills:'Design',
  portfolio:[],services:[],tools:names.map(key=>({key,icon:'auto'}))};
 const html=renderPublicSellerPage(profile,{en:false,url:'https://example.com/p/example-seller',origin:'https://example.com',title:'Example',description:'Seller'});
 for(const key of names)assert.ok(html.includes('src="/tool-logos/'+key+'.svg"'),key);
 assert.equal((html.match(/class="portfolio-brand-logo"/g)||[]).length,names.length);
 assert.ok(!html.includes('portfolio-tool-custom-icon'));
 assert.ok(!html.includes('https://cdn.'));
});
test('explicit personalized icon remains available but never replaces recognizable brand logo',()=>{
 const profile={display_name:'Example',headline:'Design',bio:'Bio',slug:'example-seller',skills:'',portfolio:[],services:[],
  tools:[{key:'photoshop',icon:'palette'},{key:'figma',icon:'auto'}]};
 const html=renderPublicSellerPage(profile,{en:true,url:'https://example.com/p/example-seller',origin:'https://example.com',title:'Example',description:'Seller'});
 assert.ok(html.includes('src="/tool-logos/photoshop.svg"'));
 assert.ok(html.includes('src="/tool-logos/figma.svg"'));
 assert.equal((html.match(/class="portfolio-tool-custom-icon"/g)||[]).length,1);
});
test('Seller Studio shares the same self-hosted branded assets and retains choices, saving and RLS',()=>{
 const editor=read('components/seller-tool-editor.tsx');
 assert.match(editor,/brandLogoFor\(tool\.key\)/);
 assert.match(editor,/Brand logo/);
 assert.match(editor,/\.update\(\{icon_key:icon\}\)/);
 assert.match(editor,/\.from\('seller_tools'\)/);
 assert.match(read('public/public-profile.css'),/\.portfolio-brand-logo/);
 assert.match(read('app/v40-seller-portfolio.css'),/\.v40-brand-icon img/);
});
