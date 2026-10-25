'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Check,GitMerge,ShieldCheck,ShieldOff,X} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import {CATEGORIES,categoryById,categoryLabel,serviceTypeById,subcategoryLabel} from '../lib/marketplace/taxonomy';

/** Friendly text for V50 database guards. */
export function categoryErrorMessage(error:unknown,en:boolean):string|null{
 const hint=(error as {hint?:string})?.hint;
 if(hint==='hx_verification_required')return en?'This category needs a verified professional. Verify the seller’s licence first, then publish.':'Энэ ангилалд баталгаажсан мэргэжилтэн шаардлагатай. Эхлээд мэргэжлийн үнэмлэхийг баталгаажуулаад дараа нь нийтэлнэ үү.';
 if(hint==='hx_suggestion_limit')return en?'You can send up to 5 category suggestions a day.':'Өдөрт 5 хүртэл ангиллын санал илгээх боломжтой.';
 return null;
}

type Service={id:string;seller_id:string;category:string;subcategory?:string|null;service_type?:string|null;tags?:string[]|null};

/** Category line for a service in admin moderation, with professional verification for regulated categories. */
export function AdminServiceCategory({service,en,sellerName,onError,onNotice}:{service:Service;en:boolean;sellerName:string;onError:(e:unknown)=>void;onNotice:(m:string)=>void}){
 const t=(mn:string,eng:string)=>en?eng:mn;
 const regulated=Boolean(categoryById(service.category)?.regulated);
 const [verified,setVerified]=useState<boolean|null>(null);
 const [busy,setBusy]=useState(false);
 const load=useCallback(async()=>{
  if(!regulated)return;
  const db=await marketplaceClient();
  const r=await db.from('professional_verifications').select('status').eq('seller_id',service.seller_id).eq('category',service.category).maybeSingle();
  if(!r.error)setVerified((r.data as {status?:string}|null)?.status==='verified');
 },[regulated,service.seller_id,service.category]);
 useEffect(()=>{void load()},[load]);
 async function setVerification(next:boolean){
  if(busy)return;setBusy(true);
  try{
   const db=await marketplaceClient();
   const r=next
    ?await db.from('professional_verifications').upsert({seller_id:service.seller_id,category:service.category,status:'verified',credential_note:t('Админ баталгаажуулсан','Verified by admin')},{onConflict:'seller_id,category'})
    :await db.from('professional_verifications').update({status:'revoked'}).eq('seller_id',service.seller_id).eq('category',service.category);
   if(r.error)throw r.error;
   await load();
   onNotice(next?t('Мэргэжилтнийг баталгаажууллаа.','Professional verified.'):t('Баталгаажуулалтыг цуцаллаа. Энэ ангилалд нийтлэгдсэн үйлчилгээ нь каталогоос нуугдана.','Verification revoked. Their services in this category are hidden from the catalog.'));
  }catch(e){onError(e)}finally{setBusy(false)}
 }
 const sub=subcategoryLabel(service.category,service.subcategory,en);
 return <div className="v50-admin-cat">
  <span>{categoryLabel(service.category,en)}{sub?' · '+sub:''} · {en?serviceTypeById(service.service_type).en:serviceTypeById(service.service_type).mn}</span>
  {service.tags&&service.tags.length>0&&<span className="v50-tags">{service.tags.map(x=><i key={x}>{x}</i>)}</span>}
  {regulated&&<span className={'v50-verify'+(verified?' is-verified':'')}>
   {verified?<ShieldCheck size={15} aria-hidden="true"/>:<ShieldOff size={15} aria-hidden="true"/>}
   {verified===null?t('Шалгаж байна…','Checking…'):verified?t(sellerName+' баталгаажсан','Verified: '+sellerName):t('Баталгаажаагүй мэргэжилтэн','Professional not verified')}
   <button type="button" className="button outline small" disabled={busy||verified===null} onClick={()=>void setVerification(!verified)}>{verified?t('Цуцлах','Revoke'):t('Мэргэжлийг баталгаажуулах','Verify professional')}</button>
  </span>}
 </div>;
}

type Suggestion={id:string;seller_id:string;parent_category:string|null;name_mn:string;name_en:string;note:string;status:string;merged_into:string;admin_note:string;created_at:string};

/** Admin queue for seller category suggestions: approve, decline or merge into an existing subcategory. */
export function AdminCategorySuggestions({en,onError,onNotice}:{en:boolean;onError:(e:unknown)=>void;onNotice:(m:string)=>void}){
 const t=(mn:string,eng:string)=>en?eng:mn;
 const [items,setItems]=useState<Suggestion[]>([]);
 const [names,setNames]=useState<Record<string,string>>({});
 const [filter,setFilter]=useState<'pending'|'all'>('pending');
 const [notes,setNotes]=useState<Record<string,string>>({});
 const [merge,setMerge]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState('');
 const handlers=useRef({onError,onNotice});handlers.current={onError,onNotice};
 const load=useCallback(async()=>{
  try{
   const db=await marketplaceClient();
   let q=db.from('category_suggestions').select('*').order('created_at',{ascending:false}).limit(100);
   if(filter==='pending')q=q.eq('status','pending');
   const r=await q;if(r.error)throw r.error;
   const rows=(r.data||[]) as Suggestion[];setItems(rows);
   const ids=[...new Set(rows.map(x=>x.seller_id))];
   if(ids.length){const p=await db.from('profiles').select('id,display_name').in('id',ids);if(!p.error)setNames(Object.fromEntries(((p.data||[]) as {id:string;display_name:string}[]).map(x=>[x.id,x.display_name])))}
  }catch(e){handlers.current.onError(e)}
 },[filter]);
 useEffect(()=>{void load()},[load]);
 async function review(item:Suggestion,status:'approved'|'rejected'|'merged'){
  if(busy)return;
  if(status==='merged'&&!merge[item.id]){handlers.current.onError(new Error(t('Нэгтгэх ангиллаа сонгоно уу.','Choose the category to merge into.')));return}
  setBusy(item.id);
  try{
   const db=await marketplaceClient();
   const r=await db.from('category_suggestions').update({status,merged_into:status==='merged'?merge[item.id]:'',admin_note:notes[item.id]||''}).eq('id',item.id);
   if(r.error)throw r.error;
   handlers.current.onNotice(status==='approved'?t('Зөвшөөрлөө. Шинэ ангиллыг дараагийн шинэчлэлтээр жагсаалтад нэмнэ.','Approved. The new category will be added to the list in the next release.'):status==='merged'?t('Одоо байгаа ангилалд нэгтгэлээ.','Merged into an existing category.'):t('Татгалзлаа.','Declined.'));
   await load();
  }catch(e){handlers.current.onError(e)}finally{setBusy('')}
 }
 return <section className="workspace-panel v50-suggestions" aria-labelledby="v50-suggestions-title">
  <div className="row-between"><h2 id="v50-suggestions-title">{t('Ангиллын санал','Category suggestions')}</h2>
   <div className="v47-row">{(['pending','all'] as const).map(f=><button key={f} type="button" className={'button small'+(filter===f?'':' outline')} onClick={()=>setFilter(f)}>{f==='pending'?t('Хүлээгдэж буй','Pending'):t('Бүгд','All')}</button>)}</div>
  </div>
  {!items.length?<p className="v47-muted">{filter==='pending'?t('Шинэ санал алга.','No pending suggestions.'):t('Санал алга.','No suggestions yet.')}</p>:
  <ul className="v47-report-list">{items.map(item=><li key={item.id} className="v47-report">
   <div className="v47-report-head"><span className={'v47-badge'+(item.status==='pending'?' v47-badge-open':item.status==='rejected'?'':' v47-badge-actioned')}>{item.status==='pending'?t('Хүлээгдэж буй','Pending'):item.status==='approved'?t('Зөвшөөрсөн','Approved'):item.status==='merged'?t('Нэгтгэсэн','Merged'):t('Татгалзсан','Declined')}</span>
    <b>{item.name_mn}{item.name_en?' / '+item.name_en:''}</b><span className="v47-muted">{new Date(item.created_at).toLocaleDateString(en?'en-US':'mn-MN')}</span></div>
   <p>{t('Санал болгосон: ','Suggested by: ')}<b>{names[item.seller_id]||t('Freelancer','Freelancer')}</b>{item.parent_category?' · '+t('Үндсэн ангилал: ','Under: ')+categoryLabel(item.parent_category,en):''}</p>
   {item.note&&<blockquote className="v47-quote">{item.note}</blockquote>}
   {item.status==='merged'&&<p className="v47-muted">{t('Нэгтгэсэн: ','Merged into: ')}{item.merged_into}</p>}
   {item.status==='pending'&&<>
    <div className="form-grid">
     <label className="v47-field">{t('Одоо байгаа ангилалд нэгтгэх','Merge into an existing subcategory')}
      <select value={merge[item.id]||''} onChange={e=>setMerge(m=>({...m,[item.id]:e.target.value}))}>
       <option value="">{t('Сонгох','Choose')}</option>
       {CATEGORIES.map(c=><optgroup key={c.id} label={en?c.en:c.mn}>{c.subcategories.map(s=><option key={s.id} value={c.id+'/'+s.id}>{en?s.en:s.mn}</option>)}</optgroup>)}
      </select></label>
     <label className="v47-field">{t('Админы тэмдэглэл','Admin note')}<input value={notes[item.id]||''} maxLength={500} onChange={e=>setNotes(n=>({...n,[item.id]:e.target.value}))}/></label>
    </div>
    <div className="v47-row">
     <button type="button" className="button small" disabled={busy===item.id} onClick={()=>void review(item,'approved')}><Check size={15} aria-hidden="true"/>{t('Зөвшөөрөх','Approve')}</button>
     <button type="button" className="button outline small" disabled={busy===item.id} onClick={()=>void review(item,'merged')}><GitMerge size={15} aria-hidden="true"/>{t('Нэгтгэх','Merge')}</button>
     <button type="button" className="button outline small" disabled={busy===item.id} onClick={()=>void review(item,'rejected')}><X size={15} aria-hidden="true"/>{t('Татгалзах','Decline')}</button>
    </div>
   </>}
  </li>)}</ul>}
 </section>;
}
