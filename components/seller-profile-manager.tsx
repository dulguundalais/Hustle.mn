'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,ArrowUpRight,BriefcaseBusiness,CheckCircle2,Eye,EyeOff,FileImage,ImagePlus,Layers3,LoaderCircle,Pencil,Plus,RefreshCw,Save,ShieldCheck,Trash2,UserRound,Wrench} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import {normalizeSellerSlug,isValidSellerSlug} from '../lib/marketplace/seller-slug';
import type {Profile} from '../lib/marketplace/types';
import SellerAvatarEditor from './seller-avatar-editor';
import SellerCoverEditor from './seller-cover-editor';
import SellerToolEditor from './seller-tool-editor';
import '../app/v42-profile-owner.css';

type Tab='about'|'photos'|'tools'|'projects'|'services';
type Item={id:string;title:string;object_path:string;url?:string};
type ProfileDraft={display_name:string;headline:string;bio:string;skills:string;slug:string;public_profile:boolean};
const fileExt:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
const emptyDraft:ProfileDraft={display_name:'',headline:'',bio:'',skills:'',slug:'',public_profile:false};
export default function SellerProfileManager(){
 const [uid,setUid]=useState('');
 const [profile,setProfile]=useState<Profile|null>(null);
 const [draft,setDraft]=useState<ProfileDraft>(emptyDraft);
 const [items,setItems]=useState<Item[]>([]);
 const [status,setStatus]=useState<'loading'|'ready'|'error'|'guest'|'not-seller'>('loading');
 const [tab,setTab]=useState<Tab>('about');
 const [buyerView,setBuyerView]=useState(false);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const [previewRevision,setPreviewRevision]=useState(0);
 const [en,setEn]=useState(false);
 const [projectTitle,setProjectTitle]=useState('');
 const [projectFile,setProjectFile]=useState<File|null>(null);
 const portfolioFile=useRef<HTMLInputElement>(null);
 const t=(mn:string,english:string)=>en?english:mn;
 const refreshPreview=useCallback(()=>setPreviewRevision(v=>v+1),[]);
 const syncProfile=(p:Profile)=>{setProfile(p);setDraft({display_name:p.display_name||'',headline:p.headline||'',bio:p.bio||'',skills:p.skills||'',slug:p.slug||'',public_profile:!!p.public_profile})};
 const loadItems=async(id:string)=>{
  const db=await marketplaceClient();
  const res=await db.from('portfolio_items').select('id,title,object_path').eq('seller_id',id).order('created_at',{ascending:false});
  if(res.error)throw res.error;
  const rows=(res.data||[]) as Item[];
  const signed=await Promise.all(rows.map(async item=>{
   const s=await db.storage.from('portfolio').createSignedUrl(item.object_path,600);
   return {...item,url:s.data?.signedUrl};
  }));
  setItems(signed);
 };
 useEffect(()=>{
  let alive=true;setStatus('loading');
  try{setEn(localStorage.getItem('hustle-language')==='en')}catch{}
  void (async()=>{
   const db=await marketplaceClient();
   const {data:{user},error:authError}=await db.auth.getUser();
   if(authError||!user){if(alive)setStatus('guest');return}
   const res=await db.from('profiles').select('*').eq('id',user.id).maybeSingle();
   if(res.error)throw res.error;
   if(!alive)return;
   const own=res.data as Profile|null;
   setUid(user.id);
   if(!own||!own.is_seller){setStatus('not-seller');return}
   syncProfile(own);
   await loadItems(user.id);
   if(alive)setStatus('ready');
  })().catch(()=>{if(alive)setStatus('error')});
  return()=>{alive=false};
 },[]);
 const validSlug=isValidSellerSlug(draft.slug);
 const publicSlug=profile?.slug&&isValidSellerSlug(profile.slug)?profile.slug:null;
 const isPublic=Boolean(profile?.public_profile&&publicSlug);
 const url=publicSlug?'/p/'+encodeURIComponent(publicSlug)+'/':'';
 const previewUrl=url+'?lang='+(en?'en':'mn')+'&rev='+previewRevision;
 const nav:[Tab,string,string,typeof UserRound][]=[
  ['about','Миний тухай','About',UserRound],
  ['photos','Зураг & Cover','Photos & cover',FileImage],
  ['tools','Skills & Tools','Skills & tools',Wrench],
  ['projects','Бүтээлүүд','Projects',Layers3],
  ['services','Үйлчилгээ','Services',BriefcaseBusiness]
 ];
 const saveProfile=async(e:React.FormEvent)=>{
  e.preventDefault();if(busy||!uid)return;
  setError('');setMessage('');
  if(draft.display_name.trim().length<2||!validSlug){setError(t('Нэр болон профайлын URL-аа шалгана уу.','Check your name and profile URL.'));return}
  setBusy(true);
  try{
   const db=await marketplaceClient();
   const {data:{user}}=await db.auth.getUser();
   if(user?.id!==uid)throw Error('Account changed');
   const payload={display_name:draft.display_name.trim().slice(0,80),headline:draft.headline.trim().slice(0,150),bio:draft.bio.trim().slice(0,3000),skills:draft.skills.trim().slice(0,400),slug:draft.slug,public_profile:draft.public_profile};
   const response=await db.from('profiles').update(payload).eq('id',uid).eq('is_seller',true).select('*').single();
   if(response.error||!response.data)throw response.error||Error('No profile response');
   syncProfile(response.data as Profile);
   refreshPreview();
   setMessage(t('Өөрчлөлт амжилттай хадгалагдлаа.','Your changes have been saved.'));
  }catch{setError(t('Хадгалж чадсангүй. Профайлын URL давхардаагүй эсэхийг шалгаарай.','Unable to save. Check whether this profile URL is already taken.'))}
  finally{setBusy(false)}
 };
 const updatePhotos=(path:string|null,kind:'avatar'|'cover',focusY=50)=>{
  setProfile(prev=>prev?{...prev,...(kind==='avatar'?{avatar_path:path}:{cover_path:path,cover_focus_y:focusY})}:prev);
  refreshPreview();
 };
 const addProject=async(e:React.FormEvent)=>{
  e.preventDefault();if(!projectFile||busy||!uid)return;
  setMessage('');setError('');
  const file=projectFile,title=projectTitle.trim();
  if(!title||title.length>140||!fileExt[file.type]||file.size===0||file.size>5*1024*1024){
   setError(t('Зургийн нэр болон 5 MB хүртэл JPEG, PNG, WebP файлыг шалгана уу.','Provide a title and a JPEG, PNG or WebP file under 5 MB.'));return;
  }
  const b=new Uint8Array(await file.slice(0,12).arrayBuffer());
  const valid=file.type==='image/jpeg'?b[0]===255&&b[1]===216&&b[2]===255:file.type==='image/png'?[137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v):String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP';
  if(!valid){setError(t('Зургийн файл буруу форматтай байна.','This file is not a valid image.'));return}
  setBusy(true);
  let path='';
  try{
   const db=await marketplaceClient();
   const {data:{user}}=await db.auth.getUser();
   if(user?.id!==uid)throw Error('Account changed');
   path=uid+'/'+crypto.randomUUID()+'.'+fileExt[file.type];
   const upload=await db.storage.from('portfolio').upload(path,file,{contentType:file.type,upsert:false});
   if(upload.error)throw upload.error;
   const insert=await db.from('portfolio_items').insert({seller_id:uid,title,object_path:path}).select('id,title,object_path').single();
   if(insert.error||!insert.data)throw insert.error||Error('Failed to save project');
   path='';setProjectTitle('');setProjectFile(null);if(portfolioFile.current)portfolioFile.current.value='';
   await loadItems(uid);refreshPreview();
   setMessage(t('Бүтээл нэмэгдлээ.','Project added.'));
  }catch{
   if(path){try{await (await marketplaceClient()).storage.from('portfolio').remove([path])}catch{}}
   setError(t('Бүтээл оруулахад алдаа гарлаа.','Could not upload this project.'));
  }finally{setBusy(false)}
 };
 const removeProject=async(item:Item)=>{
  if(busy||!uid)return;
  setBusy(true);setError('');
  try{
   const db=await marketplaceClient();
   const {data:{user}}=await db.auth.getUser();
   if(user?.id!==uid)throw Error('Account changed');
   const result=await db.from('portfolio_items').delete().eq('id',item.id).eq('seller_id',uid);
   if(result.error)throw result.error;
   setItems(list=>list.filter(x=>x.id!==item.id));
   refreshPreview();
   if(item.object_path.startsWith(uid+'/'))void db.storage.from('portfolio').remove([item.object_path]);
  }catch{setError(t('Бүтээл устгаж чадсангүй.','Could not remove the project.'))}
  finally{setBusy(false)}
 };
 if(status==='loading')return <main className="v42-owner-empty" role="status"><LoaderCircle className="spin" size={25}/>{t('Профайл ачаалж байна…','Loading your profile…')}</main>;
 if(status==='guest')return <main className="v42-owner-empty"><h1>{t('Профайл руу нэвтрэх','Sign in to your profile')}</h1><Link href="/login/?mode=seller">{t('Нэвтрэх','Sign in')} →</Link></main>;
 if(status==='not-seller')return <main className="v42-owner-empty"><h1>{t('Seller профайл шаардлагатай','Seller profile required')}</h1><p>{t('Эхлээд Seller Studio-д профайлаа үүсгээрэй.','Create your seller profile in Seller Studio first.')}</p><Link href="/seller-studio/?tab=profile">{t('Профайл үүсгэх','Set up profile')} →</Link></main>;
 if(status==='error'||!profile)return <main className="v42-owner-empty"><h1>{t('Профайл ачаалж чадсангүй','Cannot load profile')}</h1><Link href="/seller-studio/">{t('Seller Studio руу буцах','Back to Seller Studio')}</Link></main>;
 return <main className="v42-owner">
  <header className="v42-owner-top"><Link href="/" className="v42-owner-brand">hustle<span>✳</span><small>mn</small></Link><nav><Link href="/seller-studio/"><ArrowLeft size={16}/>{t('Seller Studio','Seller Studio')}</Link><Link href="/explore/">{t('Үйлчилгээ хайх','Explore')}</Link></nav></header>
  <div className="v42-owner-shell">
   <div className="v42-owner-intro"><span className="v42-owner-eyebrow">HUSTLE / SELLER PROFILE</span><h1>{t('Миний профайл','My profile')}</h1><p>{t('Buyer-ийн харах профайлыг хажууд нь харж байгаад хэсэг бүрийг засаж болно.','Edit each part while viewing the same public portfolio your buyers see.')}</p></div>
   <div className="v42-owner-status"><span className={isPublic?'v42-status-public':'v42-status-private'}>{isPublic?<Eye size={16}/>:<EyeOff size={16}/>}{isPublic?t('Нийтэд харагдана','Public profile'):t('Одоогоор нийтэд харагдахгүй','Private / setup mode')}</span>
    <div className="v42-owner-actions">{isPublic&&<Link target="_blank" rel="noopener noreferrer" href={url}>{t('Нийтийн холбоос','Public link')}<ArrowUpRight size={16}/></Link>}<button type="button" aria-pressed={buyerView} onClick={()=>setBuyerView(v=>!v)}>{buyerView?<Pencil size={16}/>:<Eye size={16}/>}{buyerView?t('Засварлах горим','Edit mode'):t('Buyer view','Buyer view')}</button></div>
   </div>
   <div className={'v42-editor-layout '+(buyerView?'buyer-view':'')}>
    {!buyerView&&<aside className="v42-edit-panel" aria-label={t('Профайл засварлах хэсэг','Profile editor')}>
     <div className="v42-editor-nav">{nav.map(([id,mn,english,Icon])=><button key={id} type="button" className={tab===id?'selected':''} aria-current={tab===id?'page':undefined} onClick={()=>{setTab(id);setError('');setMessage('')}}><Icon size={17}/>{t(mn,english)}</button>)}</div>
     <div className="v42-editor-content">
      {tab==='about'&&<form className="v42-edit-fields" onSubmit={e=>{void saveProfile(e)}}>
       <h2>{t('Танилцуулга','About me')}</h2><label>{t('Нэр','Display name')}<input required minLength={2} maxLength={80} value={draft.display_name} onChange={e=>setDraft(v=>({...v,display_name:e.target.value}))}/></label>
       <label>{t('Мэргэжил / Гарчиг','Professional headline')}<input maxLength={150} value={draft.headline} onChange={e=>setDraft(v=>({...v,headline:e.target.value}))}/></label>
       <label>{t('Миний тухай','Biography')}<textarea rows={6} maxLength={3000} value={draft.bio} onChange={e=>setDraft(v=>({...v,bio:e.target.value}))}/></label>
       <label>{t('Ур чадварууд (таслалаар)','Skills (comma separated)')}<textarea rows={3} maxLength={400} value={draft.skills} onChange={e=>setDraft(v=>({...v,skills:e.target.value}))}/></label>
       <label>{t('Профайлын хаяг','Public URL slug')}<input value={draft.slug} onChange={e=>setDraft(v=>({...v,slug:normalizeSellerSlug(e.target.value)}))} minLength={3} maxLength={60} required pattern="[a-z0-9][a-z0-9-]{2,59}"/><small>hustle.mn/p/{draft.slug||'your-name'}</small></label>
       <label className="v42-public-toggle"><input type="checkbox" checked={draft.public_profile} onChange={e=>setDraft(v=>({...v,public_profile:e.target.checked}))}/><span>{t('Профайлаа нийтэд харуулахыг зөвшөөрөх','Make my portfolio public')}</span></label>
       <button className="v42-save" type="submit" disabled={busy||!validSlug}><Save size={16}/>{busy?t('Хадгалж байна…','Saving…'):t('Өөрчлөлт хадгалах','Save changes')}</button>
      </form>}
      {tab==='photos'&&<div className="v42-photo-panel"><h2>{t('Зураг & Cover','Photos & cover')}</h2><SellerCoverEditor sellerId={uid} coverPath={profile.cover_path} focusY={profile.cover_focus_y} en={en} onChange={(path,y)=>updatePhotos(path,'cover',y)}/><div className="v42-avatar-panel"><SellerAvatarEditor sellerId={uid} name={profile.display_name} avatarPath={profile.avatar_path} en={en} onChange={path=>updatePhotos(path,'avatar')}/></div></div>}
      {tab==='tools'&&<div className="v42-owner-tools"><SellerToolEditor sellerId={uid} en={en} onUpdated={refreshPreview}/></div>}
      {tab==='projects'&&<section className="v42-project-editor"><h2>{t('Бүтээлүүд','Projects & portfolio')}</h2><p>{t('Нийтэд харуулахыг зөвшөөрсөн профайлынхаа бүтээлүүдийг энд удирдана.','Manage images and projects you want buyers to see when your profile is public.')}</p><form onSubmit={e=>{void addProject(e)}}><label>{t('Бүтээлийн нэр','Project title')}<input required maxLength={140} value={projectTitle} onChange={e=>setProjectTitle(e.target.value)}/></label><label>{t('Зураг (JPEG, PNG, WebP)','Image (JPEG, PNG, WebP)')}<input ref={portfolioFile} type="file" required accept="image/jpeg,image/png,image/webp" onChange={e=>setProjectFile(e.target.files?.[0]||null)}/></label><button className="v42-save" disabled={busy||!projectFile} type="submit"><Plus size={16}/>{t('Бүтээл нэмэх','Add project')}</button></form>
       <div className="v42-project-list">{items.map(item=><article key={item.id}><div>{item.url?<img src={item.url} alt="" width={68} height={68}/>:<FileImage size={22}/>}</div><strong>{item.title}</strong><button type="button" disabled={busy} aria-label={t('Устгах: ','Remove: ')+item.title} onClick={()=>{void removeProject(item)}}><Trash2 size={17}/></button></article>)}{!items.length&&<p>{t('Одоогоор бүтээл алга.','No projects yet.')}</p>}</div>
      </section>}
      {tab==='services'&&<div className="v42-services-panel"><h2>{t('Миний үйлчилгээнүүд','My services')}</h2><p>{t('Үйлчилгээ, үнэ болон Basic/Standard/Premium багцуудаа Seller Studio-д удирдана.','Manage your published services and pricing packages from Seller Studio.')}</p><Link className="v42-save" href="/seller-studio/"><BriefcaseBusiness size={17}/>{t('Үйлчилгээ удирдах','Manage services')}</Link></div>}
      {error&&<p className="v42-error" role="alert">{error}</p>}
      {message&&<p className="v42-success" role="status"><CheckCircle2 size={16}/>{message}</p>}
     </div>
    </aside>}
    <section className="v42-preview-column" aria-label={t('Buyer-ийн харах профайл','Buyer-facing profile preview')}>
     <div className="v42-preview-toolbar"><div><span className="v42-live-dot"/><strong>{t('Buyer preview','Buyer preview')}</strong><small>{isPublic?t('Нийтийн профайлын бодит харагдац','Actual public portfolio view'):t('Профайл нийтэд нээгдээгүй','Not public yet')}</small></div><button type="button" onClick={refreshPreview}><RefreshCw size={16}/>{t('Шинэчлэх','Refresh')}</button></div>
     {isPublic?<iframe key={previewUrl} title={t('Нийтийн профайл','Public seller portfolio')} src={previewUrl} className="v42-preview-frame" loading="eager" referrerPolicy="strict-origin-when-cross-origin"/>:<div className="v42-not-published"><ShieldCheck size={36}/><h2>{t('Хувийн профайлаа бүрдүүлнэ үү','Finish your seller profile')}</h2><p>{t('“Миний тухай” хэсэгт мэдээллээ бөглөж, нийтэд харагдахыг зөвшөөрсний дараа buyer-ийн харагдац энд нээгдэнэ.','Fill out your details, then enable public sharing to see the exact buyer-facing portfolio.')}</p><button type="button" onClick={()=>{setBuyerView(false);setTab('about')}}>{t('Профайл бөглөх','Complete profile')}</button></div>}
    </section>
   </div>
  </div>
 </main>;
}
