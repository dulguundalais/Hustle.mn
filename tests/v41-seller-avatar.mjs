import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(p,'utf8');
const uri=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const tool=uri(read('lib/marketplace/creative-tools.ts'));
const renderer=read('lib/marketplace/public-portfolio-render.ts').replace("from './creative-tools';","from '"+tool+"';");
const {renderPublicSellerPage}=await import(uri(renderer));
const profile={display_name:'Test Seller',headline:'Designer',bio:'About',skills:'Figma',slug:'test-seller',portfolio:[],services:[],tools:[]};
const photo='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.jpg';
function html(data=profile){return renderPublicSellerPage(data,{en:false,url:'https://example.com/p/test-seller',origin:'https://example.com',title:'Test seller',description:'Bio'})}

test('public seller portrait is present only when explicit validated avatar path is projected',()=>{
 const withPhoto=html({...profile,avatar_path:photo});
 assert.match(withPhoto,/class="portfolio-hero-avatar"/);
 assert.ok(withPhoto.includes('src="/api/portfolio-image?path='));
 assert.ok(withPhoto.includes(encodeURIComponent(photo)));
 assert.match(withPhoto,/alt="Профайлын зураг: Test Seller"/);
 assert.doesNotMatch(html(),/src="\/api\/portfolio-image\?path=/);
 const malicious=html({...profile,avatar_path:'../../private.svg'});
 assert.doesNotMatch(malicious,/portfolio-image\?path=/);
 assert.match(malicious,/portfolio-hero-avatar/);
});

test('seller can upload replace or remove real images, bounded and inspected for magic bytes',()=>{
 const editor=read('components/seller-avatar-editor.tsx');
 for(const pattern of ['MAX_AVATAR_BYTES=2*1024*1024',"file.slice(0,16)","'image/jpeg'","'image/png'","'image/webp'","crypto.randomUUID()","storage.from('portfolio').upload","db.from('profiles').update({avatar_path:newPath})","update({avatar_path:null})","db.auth.getUser()","createSignedUrl(avatarPath,600)","onChange(newPath)"])assert.ok(editor.includes(pattern),pattern);
 assert.match(editor,/upsert:false/);
 assert.match(editor,/\.eq\('id',sellerId\)/);
 assert.match(editor,/\.eq\('is_seller',true\)/);
 assert.match(read('components/workspace.tsx'),/SellerAvatarEditor/);
 assert.match(read('components/workspace.tsx'),/setProfile\(old=>old\?\{\.\.\.old,avatar_path:path\}/);
});

test('same seller portrait appears in Home, Explore and service details, with letter fallback',()=>{
 const catalog=read('components/live-catalog.tsx');
 const detail=read('components/live-listing-detail.tsx');
 assert.match(catalog,/s\.avatar_path/);
 assert.match(catalog,/v41-card-avatar-img/);
 assert.match(catalog,/\:avatar\}/);
 assert.match(catalog,/profileHref\?<Link/);
 assert.match(detail,/listing\?\.avatar_path/);
 assert.match(detail,/v39-detail-avatar/);
 assert.match(detail,/\?\<img src=\{avatarSrc\}/);
 assert.match(read('app/v39-creative-cards.css'),/\.v41-card-avatar-img/);
 assert.match(read('public/public-profile.css'),/\.portfolio-hero-avatar img/);
});

test('avatar remains private until owner opted in and is approved: same bucket, no public switch',()=>{
 const sql=read('supabase/migrations/20261024185000_v41_seller_avatar_photos.sql');
 assert.match(sql,/public_avatar_image/);
 assert.match(sql,/p.avatar_path=object_name and p.public_profile and p.is_seller and a.enabled/);
 assert.match(sql,/bucket_id='portfolio'/);
 assert.match(sql,/to anon/);
 assert.match(sql,/profiles_avatar_owner_path/);
 assert.match(sql,/p.avatar_path/);
 assert.match(sql,/jsonb_agg\(row\)/);
 assert.match(sql,/s.status='published' and p.is_seller and p.public_profile/);
 assert.doesNotMatch(sql,/update storage.buckets set public\s*=\s*true/i);
 assert.doesNotMatch(sql,/service_role|grant all on storage.objects/i);
 assert.match(read('lib/marketplace/public-profile.ts'),/createSignedUrl|storage\/v1\/object\/sign\/portfolio/);
});
