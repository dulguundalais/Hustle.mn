'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {MessageCircle,ArrowUpRight,ShieldCheck} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import {normalizeSearch} from '../lib/marketplace/smart-search';
import {PackagePicker,type ServicePackage,type Tier} from './service-packages';
import '../app/live-catalog.css';

// This is the public discovery RPC, not the illustrative sample catalog.
// It returns published services only from opted-in, enabled sellers.
type PublicService={
  id:string;title:string;title_en:string;description:string;category:string;
  price:number;delivery_days:number;revisions:number;package_name:string;
  display_name:string;headline:string;slug:string;packages?:ServicePackage[];
};
const money=(n:number)=>new Intl.NumberFormat('mn-MN').format(n)+' ₮';

export function contactSellerHref(slug:string):string {
  return /^[a-z0-9][a-z0-9-]{2,59}$/.test(slug)
    ? '/login/?mode=buyer&seller='+encodeURIComponent(slug)
    : '/login/?mode=buyer';
}

export default function LiveCatalog({en,query='',category='all'}:{en:boolean;query?:string;category?:string}){
  const [services,setServices]=useState<PublicService[]>([]);
  const [state,setState]=useState<'loading'|'ready'|'error'>('loading');
  const [expanded,setExpanded]=useState<string|null>(null);
  const [selectedPackage,setSelectedPackage]=useState<Record<string,Tier>>({});
  const [compare,setCompare]=useState<string|null>(null);
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
  const filtered=useMemo(()=>{
    const term=normalizeSearch(query);
    return services.filter(s=>(category==='all'||s.category===category)&&(
      !term||normalizeSearch([s.title,s.title_en,s.description,s.display_name,s.headline].join(' ')).includes(term)
    ));
  },[services,query,category]);
  const t=(mn:string,eng:string)=>en?eng:mn;
  return <section className="shell live-catalog" aria-labelledby="real-listings-title">
    <div className="section-top">
      <div><div className="eyebrow muted">HUSTLE.MN / VERIFIED BETA MARKETPLACE</div>
        <h2 id="real-listings-title">{t('Бодит мэргэжилтнүүдийн үйлчилгээ','Real freelancer listings')}</h2>
        <p>{t('Нийтлэхийг зөвшөөрсөн, идэвхтэй seller-ийн зар. Үйлчилгээг нэвтрэхгүйгээр үзээд холбогдоорой.','Published services from opted-in sellers. Browse before signing in.')}</p>
      </div>
      <span className="live-catalog-mark"><ShieldCheck size={15}/>{t('Бодит зар','Live listings')}</span>
    </div>
    {state==='loading'&&<p className="live-catalog-state" role="status">{t('Үйлчилгээг шалгаж байна...','Loading published listings...')}</p>}
    {state==='error'&&<p className="live-catalog-state" role="status">{t('Бодит заруудыг ачаалж чадсангүй. Бета тохиргоог шалгана уу.','Live listings are unavailable. Check beta configuration.')}</p>}
    {state==='ready'&&!filtered.length&&<div className="live-catalog-empty">
      <h3>{t('Одоогоор нийтлэгдсэн бодит зар алга','No live listings published yet')}</h3>
      <p>{t('Доорх загварууд нь зөвхөн жишиг бүтээл. Бодит freelancer-ийн зар нийтлэгдмэгц энд харагдана.','The designs below are examples, not contactable freelancers. Real listings will appear here once approved.')}</p>
      <Link className="button outline" href="/join/seller/">{t('Эхний freelancer-ээр нэгдэх','Become a freelancer')}<ArrowUpRight size={16}/></Link>
    </div>}
    {state==='ready'&&filtered.length>0&&<div className="live-catalog-grid">{filtered.map(s=><article key={s.id} className="live-catalog-card">
      <span className="eyebrow muted">{s.category.toUpperCase()} · {s.package_name||'SERVICE'}</span>
      <h3>{en&&s.title_en?s.title_en:s.title}</h3>
      <p className="live-seller-name">{s.display_name}{s.headline?' · '+s.headline:''}</p>
      <p className="live-catalog-description">{expanded===s.id?s.description:s.description.slice(0,145)+(s.description.length>145?'…':'')}</p>
      {s.description.length>145&&<button className="live-expand" onClick={()=>setExpanded(expanded===s.id?null:s.id)}>{expanded===s.id?t('Хураах','Less'):t('Дэлгэрэнгүй','Read more')}</button>}
      {s.packages&&s.packages.length>0&&<><button className="live-expand" type="button" aria-expanded={compare===s.id} onClick={()=>setCompare(compare===s.id?null:s.id)}>{compare===s.id?t('Багцуудыг харьцуулах','Compare packages'):t('Basic / Standard / Premium харах','View Basic / Standard / Premium')}</button>{compare===s.id&&<PackagePicker en={en} items={s.packages} chosen={selectedPackage[s.id]||'Basic'} onChange={tier=>setSelectedPackage(previous=>({...previous,[s.id]:tier}))}/>}</>}
      <div className="live-catalog-bottom"><div><small>{t('Эхлэх үнэ','Starting at')}</small><strong>{money(s.price)}</strong><small>{s.delivery_days} {t('хоног','days')} · {s.revisions} {t('засвар','revisions')}</small></div>
      <Link className="button" href={contactSellerHref(s.slug)}><MessageCircle size={16}/>{t('Холбогдох','Contact seller')}</Link><Link className="live-expand" href={'/login/?mode=buyer&service='+encodeURIComponent(s.id)}>{t('Багцаа сонгож захиалах','Choose package & request')}</Link></div>
    </article>)}</div>}
    {state==='ready'&&filtered.length>0&&<p className="live-catalog-note">{t('Холбогдохын тулд зөвшөөрөгдсөн бета аккаунтаар нэвтэрнэ. Нэвтрээд сонгосон seller-ийн чат руу орно.','Contact requires an approved beta account; sign-in returns you to the chosen seller conversation.')}</p>}
  </section>;
}
