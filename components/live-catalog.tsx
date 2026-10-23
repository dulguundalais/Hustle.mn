'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {MessageCircle,ArrowUpRight,ShieldCheck,Check,Clock3,RotateCcw,Star,Layers3,ChevronDown} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import ServiceComparison,{compareSelection,compareLimit} from './service-comparison';
import {filterLiveServices,type LiveService,type LiveSort} from '../lib/marketplace/live-discovery';
import {tiers,type ServicePackage,type Tier} from './service-packages';
import '../app/live-catalog.css';
import '../app/v23-ui-polish.css';

// Public discovery contains only published listings and opted-in sellers.
type PublicService = LiveService;
const money=(n:number)=>new Intl.NumberFormat('mn-MN').format(n)+' ₮';

export function contactSellerHref(slug:string):string {
 return /^[a-z0-9][a-z0-9-]{2,59}$/.test(slug)
  ? '/login/?mode=buyer&seller='+encodeURIComponent(slug)
  : '/login/?mode=buyer';
}
export default function LiveCatalog({en,query='',category='all',sort='featured',onlySaved=false,saved=[],onSave,canSave=false,saveBusy=[],saveError='',onSignInSave}:{en:boolean;query?:string;category?:string;sort?:LiveSort;onlySaved?:boolean;saved?:string[];onSave?:(id:string)=>void;canSave?:boolean;saveBusy?:string[];saveError?:string;onSignInSave?:()=>void}){
 const [services,setServices]=useState<PublicService[]>([]);
 const [compared,setCompared]=useState<string[]>([]);
 const [showCompare,setShowCompare]=useState(false);
 const [state,setState]=useState<'loading'|'ready'|'error'>('loading');
 const [expanded,setExpanded]=useState<string|null>(null);
 const [selectedPackage,setSelectedPackage]=useState<Record<string,Tier>>({});
 useEffect(()=>{
  let active=true;
  marketplaceClient().then(db=>db.rpc('marketplace_catalog')).then(result=>{
   if(!active)return;
   if(result.error)throw result.error;
   setServices(Array.isArray(result.data)?result.data as PublicService[]:[]);
   setState('ready');
  }).catch(()=>{if(active)setState('error')});
  return()=>{active=false};
 },[]);
 const compareReady=compared.length>=2;
 const toggleCompare=(id:string)=>setCompared(current=>compareSelection(current,id));
 const filtered=useMemo(()=>filterLiveServices(services,{query,category,sort,onlySaved,saved}),[services,query,category,sort,onlySaved,saved]);
 const t=(mn:string,eng:string)=>en?eng:mn;
 return <section className="shell live-catalog v23-live-catalog" aria-labelledby="real-listings-title">
  <div className="section-top v23-market-head"><div><div className="eyebrow muted">HUSTLE.MN / THE MARKETPLACE</div>
   <h2 id="real-listings-title">{t('Танд тохирох мэргэжилтэн энд байна.','Great work starts with the right match.')}</h2>
   <p>{t('Бодит нийтлэгдсэн үйлчилгээ, ил тод үнийн багцууд. Харилцаагаа эндээс эхлүүлээрэй.','Explore real published services, compare the packages, and start a conversation.')}</p>
  </div><span className="live-catalog-mark"><ShieldCheck size={18}/>{t('Бодит үйлчилгээ','Real listings')}</span></div>
  {state==='ready'&&services.length>0&&<div className="v37-toolbar">
   <button type="button" className="v37-open" disabled={!compareReady} onClick={()=>setShowCompare(v=>!v)} aria-expanded={showCompare&&compareReady}>{showCompare?t('Харьцуулалтыг хаах','Close comparison'):t('Харьцуулах','Compare')} ({compared.length}/{compareLimit})</button>
   {compared.length>0&&<button type="button" onClick={()=>{setCompared([]);setShowCompare(false)}}>{t('Сонголт арилгах','Clear selection')}</button>}
   <span className="v37-save-note">{t('2–3 бодит үйлчилгээг сонгоорой.','Select 2–3 published services.')}</span>
   {saveError&&<span role="alert" className="v37-save-note">{saveError}</span>}
  </div>}
  {state==='ready'&&showCompare&&compareReady&&<ServiceComparison en={en} services={services} ids={compared} onRemove={id=>setCompared(v=>compareSelection(v,id))} onClear={()=>{setCompared([]);setShowCompare(false)}}/>}
  {state==='loading'&&<p className="live-catalog-state" role="status">{t('Үйлчилгээг шалгаж байна...','Loading published listings...')}</p>}
  {state==='error'&&<p className="live-catalog-state" role="status">{t('Бодит заруудыг ачаалж чадсангүй. Бета тохиргоог шалгана уу.','Live listings are unavailable. Check beta configuration.')}</p>}
  {state==='ready'&&!filtered.length&&<div className="live-catalog-empty"><h3>{t('Одоогоор нийтлэгдсэн бодит зар алга','No live listings published yet')}</h3><p>{t('Доорх загварууд нь зөвхөн жишиг бүтээл. Seller-ийн зар батлагдмагц энд гарна.','The designs below are examples only. Real seller listings appear here when approved.')}</p><Link className="button outline" href="/join/seller/">{t('Эхний freelancer-ээр нэгдэх','Become a freelancer')}<ArrowUpRight size={17}/></Link></div>}
  {state==='ready'&&<p className="v28-results-count" aria-live="polite">{filtered.length} {t("бодит үйлчилгээ","published services")}</p>}
  {state==='ready'&&filtered.length>0&&<div className={'live-catalog-grid v23-service-grid '+(filtered.length===1?'v23-single-listing':'')}>
   {filtered.map(s=>{
    const available=tiers.map(tier=>s.packages?.find(p=>p.tier===tier)).filter((p):p is ServicePackage=>Boolean(p)&&Boolean(p?.price&&p.price>0));
    const defaultTier=available.find(p=>p.tier==='Basic')?.tier||available[0]?.tier||'Basic';
    const choice=selectedPackage[s.id]||defaultTier;
    const picked=available.find(p=>p.tier===choice)||available[0];
    const hasPackages=available.length>0;
    const price=picked?.price??s.price;
    const days=picked?.delivery_days??s.delivery_days;
    const revisions=picked?.revisions??s.revisions;
    const rating=Number(s.average_rating);
    const verified=(Number(s.review_count)||0)>0&&Number.isFinite(rating)&&rating>=1&&rating<=5;
    return <article key={s.id} className="live-catalog-card v23-service-card">
     <div className="v23-service-main">
      <div className="v23-service-eyebrow"><span className="v23-category-pill"><Layers3 size={17}/>{s.category}</span><span className="v23-public-label"><ShieldCheck size={16}/>{t('Нийтлэгдсэн','Published')}</span></div>
      <div className="v28-listing-title"><h3><Link href={'/listing/?id='+encodeURIComponent(s.id)}>{en&&s.title_en?s.title_en:s.title}</Link></h3>{onSave&&<button className="v28-save-service" type="button" aria-label={saved.includes(s.id)?t('Хадгалснаас хасах','Remove saved service'):t('Үйлчилгээ хадгалах','Save service')} aria-pressed={saved.includes(s.id)} disabled={saveBusy.includes(s.id)} onClick={()=>canSave?onSave(s.id):onSignInSave?.()}>{saved.includes(s.id)?'♥':'♡'}</button>}</div>
      <div className="v23-seller"><span className="v23-seller-avatar" aria-hidden="true">{s.display_name.trim().slice(0,1).toLocaleUpperCase()}</span><div><strong>{s.display_name}</strong>{s.headline&&<span>{s.headline}</span>}</div></div>
      {verified&&<p className="v23-service-rating"><Star size={18} fill="currentColor"/><strong>{rating.toFixed(1)}</strong><span>({s.review_count} {t('баталгаажсан үнэлгээ','verified reviews')})</span></p>}
      <p className="live-catalog-description">{expanded===s.id?s.description:s.description.slice(0,215)+(s.description.length>215?'…':'')}</p>
      {s.description.length>215&&<button className="live-expand v23-read-more" type="button" aria-expanded={expanded===s.id} onClick={()=>setExpanded(expanded===s.id?null:s.id)}>{expanded===s.id?t('Хураах','Read less'):t('Дэлгэрэнгүй унших','Read more')}<ChevronDown size={17}/></button>}
     </div>
     <div className="v37-card-selection"><button type="button" className="v37-select" aria-pressed={compared.includes(s.id)} disabled={!compared.includes(s.id)&&compared.length>=compareLimit} onClick={()=>toggleCompare(s.id)}>{compared.includes(s.id)?'✓ ':'+ '}{t('Харьцуулах','Compare')}</button></div>
     <div className="v23-service-offer">
      <div className="v23-offer-heading"><div><span className="v23-offer-label">{t('Үнийн багцаа сонгох','Choose your package')}</span><h4>{t('Танд тохирох сонголт','The right fit for your project')}</h4></div></div>
      <div className="v23-tier-tabs" role="group" aria-label={t('Үнийн багц сонгох','Choose a package')}>{tiers.map(tier=>{
       const disabled=hasPackages&&!available.some(p=>p.tier===tier)||!hasPackages&&tier!=='Basic';
       return <button key={tier} type="button" disabled={disabled} aria-pressed={choice===tier} aria-label={disabled?tier+' '+t('одоогоор байхгүй','not available'):tier} className={choice===tier?'active':''} onClick={()=>setSelectedPackage(prev=>({...prev,[s.id]:tier}))}>{tier}</button>
      })}</div>
      <div className="v23-offer-details" aria-live="polite">
       <div className="v23-price-label">{t('Багцын үнэ · Төлбөргүй бета','Package price · No-payment beta')}</div>
       <div className="v23-price">{money(price)}</div>
       <div className="v23-offer-metrics"><span><Clock3 size={19}/>{days} {t('хоног','days')}</span><span><RotateCcw size={19}/>{revisions} {t('засвар','revisions')}</span></div>
       {picked?.summary&&<p className="v23-package-summary">{picked.summary}</p>}
       {picked&&picked.includes.length>0&&<ul className="v23-inclusions">{picked.includes.slice(0,4).map((item,i)=><li key={i}><Check size={17}/><span>{item}</span></li>)}</ul>}
      </div>
      <div className="v23-card-actions">
       <Link className="button v23-primary-action" href={'/login/?mode=buyer&service='+encodeURIComponent(s.id)+'&tier='+encodeURIComponent(choice)}>{t('Энэ багцаар захиалах','Request this package')}<ArrowUpRight size={19}/></Link>
       <Link className="button outline v23-secondary-action" href={contactSellerHref(s.slug)}><MessageCircle size={18}/>{t('Freelancer-тэй ярилцах','Contact freelancer')}</Link>
      </div>
     </div>
    </article>;
   })}
  </div>}
  {state==='ready'&&filtered.length>0&&<p className="live-catalog-note v23-catalog-note"><ShieldCheck size={18}/>{t('Холбогдохын тулд зөвшөөрөгдсөн бета аккаунтаар нэвтэрнэ. Бодит төлбөр хийгдэхгүй.','Sign in with an approved beta account to contact sellers. No real payments are processed.')}</p>}
 </section>;
}
