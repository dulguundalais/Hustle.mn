'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {marketplaceClient} from '../lib/marketplace/client';
import type {LiveService} from '../lib/marketplace/live-discovery';
import '../app/live-listing.css';
import '../app/v39-service-detail.css';

const money=(n:number)=>new Intl.NumberFormat('mn-MN').format(n)+' ₮';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
type Tier='Basic'|'Standard'|'Premium';
export default function LiveListingDetail(){
 const [listing,setListing]=useState<LiveService|null>(null);
 const [status,setStatus]=useState<'loading'|'ready'|'missing'|'error'>('loading');
 const [tier,setTier]=useState<Tier>('Basic');
 const [en,setEn]=useState(false);
 const t=(mn:string,english:string)=>en?english:mn;
 useEffect(()=>{
   let active=true;
   setEn(localStorage.getItem('hustle-language')==='en');
   const id=new URLSearchParams(location.search).get('id')||'';
   if(!uuid.test(id)){setStatus('missing');return()=>{active=false};}
   void marketplaceClient().then(db=>db.rpc('marketplace_catalog')).then(result=>{
     if(!active)return;
     if(result.error)throw result.error;
     const match=(Array.isArray(result.data)?result.data as LiveService[]:[]).find(s=>s.id===id);
     setListing(match||null);setStatus(match?'ready':'missing');
     const first=match?.packages?.find(p=>p.tier==='Basic'&&p.price>0)?.tier||match?.packages?.find(p=>p.price>0)?.tier;
     if(first==='Basic'||first==='Standard'||first==='Premium')setTier(first);
   }).catch(()=>{if(active)setStatus('error')});
   return()=>{active=false};
 },[]);
 const options=(listing?.packages||[]).filter(p=>p.price>0);
 const chosen=options.find(p=>p.tier===tier)||options[0];
 const price=chosen?.price??listing?.price??0;
 const valid=Boolean(listing&&uuid.test(listing.id)&&price>0);
 const avatarSrc=listing?.avatar_path&&/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(listing.avatar_path)?'/api/portfolio-image?path='+encodeURIComponent(listing.avatar_path):null;
 return <main className="v28-detail-page v39-detail-page">
  <header className="v28-detail-header"><Link href="/">hustle<span>✳</span>.mn</Link><Link href="/explore/">{t('Бүх үйлчилгээ','Explore services')} ↗</Link></header>
  {status==='loading'&&<section className="v28-detail-shell" role="status">{t('Үйлчилгээ ачаалж байна…','Loading service…')}</section>}
  {status==='error'&&<section className="v28-detail-shell" role="alert">{t('Үйлчилгээ ачаалж чадсангүй. Дахин оролдоно уу.','Unable to load service. Please retry.')}</section>}
  {status==='missing'&&<section className="v28-detail-shell"><h1>{t('Үйлчилгээ олдсонгүй','Service not found')}</h1><p>{t('Энэ зар нийтлэгдээгүй эсвэл устгагдсан байж болно.','This listing may be unpublished or removed.')}</p><Link href="/explore/">{t('Үйлчилгээ хайх','Browse listings')}</Link></section>}
  {status==='ready'&&listing&&<div className="v28-detail-shell v28-detail-grid">
    <article><div className={'v39-detail-cover v39-detail-cover-'+listing.category}><span>hustle✳</span></div><div className="v28-detail-kicker">{listing.category} · {t('БАТАЛГААЖСАН НИЙТЛЭЛ','PUBLISHED SERVICE')}</div>
      <h1>{en&&listing.title_en?listing.title_en:listing.title}</h1>
      <div className="v28-detail-seller"><span className="v39-detail-avatar" aria-hidden="true">{avatarSrc?<img src={avatarSrc} alt="" width={52} height={52}/>: (listing.display_name.trim().charAt(0)||'H').toLocaleUpperCase()}</span><strong>{listing.display_name}</strong>{listing.headline&&<span>{listing.headline}</span>}</div>
      {Number(listing.review_count)>0&&Number.isFinite(Number(listing.average_rating))&&Number(listing.average_rating)>0&&<p className="v39-detail-reviews">★ {Number(listing.average_rating).toFixed(1)} · {listing.review_count} {t('баталгаажсан үнэлгээ','verified reviews')}</p>}
      <h2 className="v39-detail-about-heading">{t('Үйлчилгээний тухай','About this service')}</h2><p className="v28-detail-description">{listing.description}</p>
      <Link href={'/p/'+encodeURIComponent(listing.slug)}>{t('Freelancer-ийн профайл','View seller profile')} ↗</Link>
      <p className="v28-detail-policy">{t('Хаалттай бета туршилт: захиалга нь хүсэлт бөгөөд бодит төлбөр хийхгүй.','Closed beta: orders are requests; no money is collected.')}</p>
    </article>
    <aside className="v28-detail-offer"><p>{t('Багцаа сонгоно уу','Choose a package')}</p>
      {options.length>0&&<div className="v28-detail-tiers">{(['Basic','Standard','Premium'] as const).map(option=><button key={option} type="button" aria-pressed={tier===option} disabled={!options.some(p=>p.tier===option)} onClick={()=>setTier(option)}>{option}</button>)}</div>}
      <div className="v28-detail-price">{money(price)}</div>
      <div className="v28-detail-spec"><span>{chosen?.delivery_days??listing.delivery_days} {t('хоног','days')}</span><span>{chosen?.revisions??listing.revisions} {t('засвар','revisions')}</span></div>
      {chosen?.summary&&<p>{chosen.summary}</p>}
      {chosen?.includes?.length>0&&<ul>{chosen.includes.map((item,i)=><li key={i}>✓ {item}</li>)}</ul>}
      {valid&&<Link className="v28-detail-primary" href={'/login/?mode=buyer&service='+encodeURIComponent(listing.id)+'&tier='+encodeURIComponent(chosen?.tier||'Basic')}>{t('Энэ багцаар хүсэлт илгээх','Request this package')} ↗</Link>}
      {listing.slug&&<Link className="v28-detail-secondary" href={'/login/?mode=buyer&seller='+encodeURIComponent(listing.slug)}>{t('Freelancer-тэй ярилцах','Message this seller')}</Link>}
    </aside>
  </div>}
 </main>;
}
