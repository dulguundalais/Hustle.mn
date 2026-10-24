'use client';
import {useEffect,useRef,useState} from 'react';
import {Camera,ImagePlus,Trash2,UploadCloud} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import '../app/v41-seller-avatar.css';

const MAX_AVATAR_BYTES=2*1024*1024;
const formats:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
const uuid=/^[a-f0-9-]{36}$/i;

export async function checkAvatarFile(file:File):Promise<string|null>{
 if(!formats[file.type])return 'format';
 if(file.size===0||file.size>MAX_AVATAR_BYTES)return 'size';
 const b=new Uint8Array(await file.slice(0,16).arrayBuffer());
 const jpeg=b.length>=3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff;
 const png=b.length>=8&&[137,80,78,71,13,10,26,10].every((x,i)=>b[i]===x);
 const webp=b.length>=12&&String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP';
 return (file.type==='image/jpeg'&&jpeg)||(file.type==='image/png'&&png)||(file.type==='image/webp'&&webp)?null:'format';
}

export default function SellerAvatarEditor({sellerId,name,avatarPath,onChange,en}:{
 sellerId:string;name:string;avatarPath?:string|null;onChange:(path:string|null)=>void;en:boolean
}){
 const [preview,setPreview]=useState<string|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const picker=useRef<HTMLInputElement>(null);
 const t=(mn:string,english:string)=>en?english:mn;
 const initial=(name.trim().charAt(0)||'H').toLocaleUpperCase();
 useEffect(()=>{
  let active=true;
  setPreview(null);
  if(!avatarPath)return()=>{active=false};
  void marketplaceClient().then(db=>db.storage.from('portfolio').createSignedUrl(avatarPath,600))
   .then(({data,error})=>{if(active&&data?.signedUrl&&!error)setPreview(data.signedUrl)})
   .catch(()=>{});
  return()=>{active=false};
 },[avatarPath,sellerId]);
 async function checkAccount(){
  const db=await marketplaceClient();
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||user?.id!==sellerId||!uuid.test(sellerId))throw Error('session');
  return db;
 }
 async function upload(file:File|undefined){
  if(!file||loading)return;
  setError('');
  const invalid=await checkAvatarFile(file);
  if(invalid){setError(invalid==='size'?t('Зураг 2 MB-аас бага байх ёстой.','Photo must be under 2 MB.'):t('Зөвхөн JPEG, PNG эсвэл WebP зураг сонгоно уу.','Choose a genuine JPEG, PNG or WebP image.'));return}
  setLoading(true);
  let newPath='';
  try{
   const db=await checkAccount();
   newPath=sellerId+'/'+crypto.randomUUID()+'.'+formats[file.type];
   const saved=await db.storage.from('portfolio').upload(newPath,file,{contentType:file.type,upsert:false,cacheControl:'3600'});
   if(saved.error)throw saved.error;
   const updated=await db.from('profiles').update({avatar_path:newPath}).eq('id',sellerId).eq('is_seller',true).select('avatar_path').single();
   if(updated.error||updated.data?.avatar_path!==newPath)throw updated.error||new Error('Profile update failed');
   const former=avatarPath;
   const committedPath=newPath;
   onChange(committedPath);
   // The database now references this object: later preview failure must NOT delete it.
   newPath='';
   if(former&&former.startsWith(sellerId+'/')&&former!==committedPath)void db.storage.from('portfolio').remove([former]);
   // Loading a preview is best-effort; saving the profile picture already succeeded.
   try{const url=await db.storage.from('portfolio').createSignedUrl(committedPath,600);if(url.data?.signedUrl)setPreview(url.data.signedUrl)}catch{}
  }catch{
   if(newPath){try{const db=await marketplaceClient();await db.storage.from('portfolio').remove([newPath])}catch{}}
   setError(t('Зураг хадгалахад алдаа гарлаа. Дахин оролдоно уу.','Could not save the photo. Please retry.'));
  }finally{setLoading(false);if(picker.current)picker.current.value=''}
 }
 async function remove(){
  if(loading||!avatarPath)return;
  setLoading(true);setError('');
  try{
   const db=await checkAccount();
   const updated=await db.from('profiles').update({avatar_path:null}).eq('id',sellerId).eq('is_seller',true).select('avatar_path').single();
   if(updated.error||updated.data?.avatar_path!==null)throw updated.error||new Error('Could not remove');
   const old=avatarPath;
   onChange(null);setPreview(null);
   if(old.startsWith(sellerId+'/'))void db.storage.from('portfolio').remove([old]);
  }catch{setError(t('Зураг устгахад алдаа гарлаа.','Could not remove your photo.'))}
  finally{setLoading(false)}
 }
 return <section className="v41-avatar-editor" aria-label={t('Профайлын зураг','Profile photo')}>
  <div className="v41-avatar-preview">{preview?<img src={preview} alt={t('Миний профайлын зураг','My profile picture')} width={104} height={104}/>:<span aria-hidden="true">{initial}</span>}<i aria-hidden="true"><Camera size={16}/></i></div>
  <div className="v41-avatar-info"><h3>{t('Профайлын зураг','Profile picture')}</h3>
   <p>{t('Нүүр хуудасны seller card, үйлчилгээ болон public portfolio дээр ижил зураг харагдана. 1:1 хэмжээтэй JPEG, PNG, WebP · 2 MB хүртэл.','Your photo will appear on seller cards, service details and your public portfolio. Square JPEG, PNG or WebP, up to 2 MB.')}</p>
   <input ref={picker} className="v41-avatar-file" type="file" accept="image/jpeg,image/png,image/webp" aria-label={t('Зураг сонгох','Choose a profile photo')} disabled={loading} onChange={e=>{void upload(e.currentTarget.files?.[0])}}/>
   <div className="v41-avatar-actions"><button type="button" className="button" disabled={loading} onClick={()=>picker.current?.click()}><ImagePlus size={16}/>{loading?t('Хадгалж байна…','Saving…'):preview?t('Зураг солих','Change photo'):t('Зураг оруулах','Upload photo')}</button>
   {avatarPath&&<button type="button" className="button outline" disabled={loading} onClick={()=>{void remove()}}><Trash2 size={16}/>{t('Устгах','Remove')}</button>}</div>
   <p className="v41-avatar-note">{t('Нийтэд нээх зөвшөөрөл идэвхгүй үед энэ зураг зөвхөн танд харагдана.','Until you enable public sharing, only you can see this photo.')}</p>
   {error&&<p className="v41-avatar-error" role="alert">{error}</p>}
  </div>
 </section>;
}
