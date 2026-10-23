'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,ArrowUpRight,Check,ChevronRight,Clapperboard,Code2,Globe2,Layers3,MessageCircle,MousePointer2,Search,ShieldCheck,Sparkles,Star,PenTool,BriefcaseBusiness,CheckCircle2} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import {orderRecommended} from '../lib/marketplace/recommendations';
import {services} from '../lib/marketplace/catalog';
import {suggestLiveServices,type LiveService} from '../lib/marketplace/live-discovery';
import GuidedEntry from './guided-entry';
import '../app/signature-home.css';

type T=(mn:string,en:string)=>string;
const topics=[
 {key:'design',mn:'Лого & Брэнд',en:'Logo & brand',Icon:PenTool},
 {key:'web',mn:'Вэб хөгжүүлэлт',en:'Web development',Icon:Code2},
 {key:'video',mn:'Видео & Reels',en:'Video & reels',Icon:Clapperboard},
 {key:'ui',mn:'UI/UX дизайн',en:'UI/UX design',Icon:Layers3}
];
type Spotlight={id:string;title:string;title_en?:string;category:string;price:number;display_name:string;headline:string;slug:string;review_count:number;average_rating:number|null;completed_orders:number};
const formatPrice=(amount:number)=>new Intl.NumberFormat('mn-MN').format(amount)+' ₮';

export function SignatureHero({en}:{en:boolean}){
 const [search,setSearch]=useState('');
 const [showSuggestions,setShowSuggestions]=useState(false);
 const [activeSuggestion,setActiveSuggestion]=useState(-1);
 const [publishedState,setPublishedState]=useState<'loading'|'ready'|'error'>('loading');
 const [published,setPublished]=useState<LiveService[]>([]);
 useEffect(()=>{let active=true;marketplaceClient().then(db=>db.rpc('marketplace_catalog')).then(r=>{if(!active)return;if(r.error)throw r.error;setPublished(Array.isArray(r.data)?r.data as LiveService[]:[]);setPublishedState('ready')}).catch(()=>{if(active)setPublishedState('error')});return()=>{active=false}},[]);
 const suggestions=useMemo(()=>suggestLiveServices(published,search,4),[published,search]);
 const t:T=(mn,english)=>en?english:mn;
 return <section className="signature-hero" aria-labelledby="signature-hero-title">
   <div className="signature-hero-grid" aria-hidden="true"/>
   <div className="shell signature-hero-inner">
     <div className="signature-hero-copy">
       <span className="signature-kicker"><span className="signature-kicker-pulse"/> {t('АСУУДЛАА ХЭЛ · ШИЙДЛЭЭ ОЛ','DESCRIBE THE CHALLENGE · FIND THE SOLUTION')}</span>
       <h1 id="signature-hero-title">{t('Асуудал бүрт','Every challenge')}<br/><span>{t('шийдэл бий.','has a way forward.')}</span></h1>
       <p>{t('Бизнесээ хөгжүүлэх, ажлаа автоматжуулах, санаагаа хэрэгжүүлэхэд хэрэгтэй мэргэжилтнээ ол. Яг ямар үйлчилгээ хэрэгтэйгээ мэдэх албагүй.','From growing sales to automating work, describe the problem and discover the right expertise. No jargon needed.')}</p>
       <GuidedEntry en={en}/>
       <div className="signature-search-shell" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setShowSuggestions(false)}}>
        <form action="/solutions/" method="get" className="signature-search" role="search">
         <Search size={21} aria-hidden="true"/>
         <input name="q" role="combobox" aria-label={t('Асуудлаа тайлбарлах','Describe your challenge')}
          aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={showSuggestions&&search.trim().length>1&&publishedState==='ready'}
          aria-controls="hero-search-suggestions" aria-activedescendant={activeSuggestion>=0&&showSuggestions&&suggestions[activeSuggestion]?'hero-search-option-'+activeSuggestion:undefined}
          value={search} onChange={e=>{setSearch(e.target.value);setShowSuggestions(true);setActiveSuggestion(-1)}}
          onFocus={()=>setShowSuggestions(true)}
          onKeyDown={e=>{
           if(e.key==='Escape'){setShowSuggestions(false);setActiveSuggestion(-1)}
           else if(e.key==='ArrowDown'&&suggestions.length){e.preventDefault();setShowSuggestions(true);setActiveSuggestion(i=>(i+1)%suggestions.length)}
           else if(e.key==='ArrowUp'&&suggestions.length){e.preventDefault();setShowSuggestions(true);setActiveSuggestion(i=>i<0?suggestions.length-1:(i-1+suggestions.length)%suggestions.length)}
           else if(e.key==='Enter'&&showSuggestions&&activeSuggestion>=0&&suggestions[activeSuggestion]){e.preventDefault();window.location.assign('/listing/?id='+encodeURIComponent(suggestions[activeSuggestion].id))}
          }}
          placeholder={t('Манай ресторан илүү олон захиалгатай болмоор байна…','We need more bookings but do not know where to start…')}/>
         <button type="submit"><span>{t('Шийдэл олох','Find solutions')}</span><ArrowUpRight size={19}/></button>
        </form>
        {showSuggestions&&search.trim().length>1&&publishedState==='ready'&&<div className="signature-search-suggestions" id="hero-search-suggestions" role="listbox" aria-label={t('Нийтлэгдсэн үйлчилгээний санал','Published service suggestions')}>
          {suggestions.map((item,i)=><Link id={'hero-search-option-'+i} role="option" aria-selected={activeSuggestion===i} className={activeSuggestion===i?'active':''} key={item.id} href={'/listing/?id='+encodeURIComponent(item.id)}><Search size={15}/>{en&&item.title_en?item.title_en:item.title}<span>{t('Бодит','Live')}</span></Link>)}
          {suggestions.length===0&&<p className="signature-search-no-match">{t('Энэ хайлтаар нийтлэгдсэн үйлчилгээ хараахан алга. Асуудлаа тайлбарлаж хүсэлт илгээж болно.','No published service matches yet. Describe your goal to find a solution.')}</p>}
          <Link className="signature-search-all" href={'/explore/?q='+encodeURIComponent(search)}>{t('Бодит үйлчилгээ хайх','Search published services')}<ArrowRight size={15}/></Link>
        </div>}
       </div>
       <div className="signature-problem-prompts"><Link href="/solutions/?audience=business&q=%D0%9C%D0%B0%D0%BD%D0%B0%D0%B9%20%D1%80%D0%B5%D1%81%D1%82%D0%BE%D1%80%D0%B0%D0%BD%D1%8B%20%D0%B7%D0%B0%D1%85%D0%B8%D0%B0%D0%BB%D0%B3%D0%B0%20%D0%B1%D0%B0%D0%B3%D0%B0%20%D0%B1%D0%B0%D0%B9%D0%BD%D0%B0">{t('Захиалга нэмэгдүүлэх','Increase bookings')}</Link><Link href="/solutions/?audience=business&q=%D0%94%D0%B0%D0%B2%D1%82%D0%B0%D0%B3%D0%B4%D0%B4%D0%B0%D0%B3%20%D0%B0%D0%B6%D0%BB%D0%B0%D0%B0%20%D0%B0%D0%B2%D1%82%D0%BE%D0%BC%D0%B0%D1%82%D0%B6%D1%83%D1%83%D0%BB%D0%B0%D1%85%20%D1%85%D1%8D%D1%80%D1%8D%D0%B3%D1%82%D1%8D%D0%B9%20%D0%B1%D0%B0%D0%B9%D0%BD%D0%B0">{t('AI автоматжуулалт','AI automation')}</Link><Link href="/solutions/?audience=personal&q=%D0%9B%D0%BE%D0%B3%D0%BE%20%D0%B4%D0%B8%D0%B7%D0%B0%D0%B9%D0%BD%20%D1%85%D1%8D%D1%80%D1%8D%D0%B3%D1%82%D1%8D%D0%B9%20%D0%B1%D0%B0%D0%B9%D0%BD%D0%B0">{t('Хувийн төсөл','Personal project')}</Link></div>
       <div className="signature-search-subline"><Sparkles size={14}/>{t('Smart Finder beta · Кирилл, латин, англи хэлээр асуудлаа бичээрэй.','Smart Finder beta · Describe your challenge in Mongolian, Latin or English.')}</div>
     </div>
     <div className="signature-orbit" aria-label={t('Бүтээлч ур чадварыг дүрсэлсэн график','Abstract constellation of creative disciplines')}>
       <div className="signature-orbit-halo"/>
       <div className="signature-orbit-ring ring-one"/>
       <div className="signature-orbit-ring ring-two"/>
       
       <div className="signature-orbit-center"><span className="signature-orbit-symbol">h<span>✳</span></span><small>IDEAS INTO IMPACT</small></div>
       <Link className="signature-orbit-chip chip-design" href="/explore/?category=design"><span className="signature-orbit-icon"><PenTool size={20}/></span><span>BRAND<br/><strong>IDENTITY</strong></span><ArrowUpRight size={15}/></Link>
       <Link className="signature-orbit-chip chip-digital" href="/explore/?category=web"><span className="signature-orbit-icon"><Code2 size={20}/></span><span>DIGITAL<br/><strong>EXPERIENCES</strong></span><ArrowUpRight size={15}/></Link>
       
       <i className="signature-orbit-star star-a"/><i className="signature-orbit-star star-b"/><i className="signature-orbit-star star-c"/><i className="signature-orbit-star star-d"/>
       <div className="signature-orbit-side-label">HUSTLE / CREATIVE NETWORK / 2026</div>
     </div>
   </div>
 </section>;
}

const buyerSteps=[
 {index:'01',mn:'Хэрэгтэй ур чадвараа ол',en:'Discover the right expert',descMn:'Үйлчилгээ, ажил, санал болгож буй гурван багцыг харьцуул.',descEn:'Browse published services and compare what every package includes.',Icon:Search},
 {index:'02',mn:'Ярилцаж, захиалга өг',en:'Connect and request',descMn:'Мэргэжилтэнтэй чатлаад ажлын зорилго, хугацаагаа тохиролц.',descEn:'Message the freelancer and agree on scope before requesting an order.',Icon:MessageCircle},
 {index:'03',mn:'Явцаа хянаж, ажлаа ав',en:'Review and receive',descMn:'Захиалгын явцыг хянаж, шаардлагатай засвараа хүс.',descEn:'Track progress, request revisions and approve the finished work.',Icon:CheckCircle2}
];
const sellerSteps=[
 {index:'01',mn:'Өөрийн студийг нээ',en:'Create your studio',descMn:'Профайл, portfolio болон ур чадвараа танилцуул.',descEn:'Showcase your profile, portfolio and the work you do best.',Icon:BriefcaseBusiness},
 {index:'02',mn:'Гурван багцаа санал болго',en:'Define your packages',descMn:'Basic, Standard, Premium-ийн үнэ, хугацаа, багтсан ажлыг тохируул.',descEn:'Price Basic, Standard and Premium with clear deliverables.',Icon:Layers3},
 {index:'03',mn:'Хамтран ажиллаж, хүргэ',en:'Connect and deliver',descMn:'Хүсэлтийг хүлээн авч, чатлаад ажлаа хүлээлгэн өг.',descEn:'Respond to requests, collaborate and deliver your work.',Icon:CheckCircle2}
];
export function SignatureStory({en}:{en:boolean}){
 const [mode,setMode]=useState<'buyer'|'seller'>('buyer');
 const [spotlights,setSpotlights]=useState<Spotlight[]>([]);
 const [state,setState]=useState<'loading'|'ready'|'error'>('loading');
 const t:T=(mn,english)=>en?english:mn;
 useEffect(()=>{
  let active=true;
  marketplaceClient().then(db=>db.rpc('marketplace_catalog')).then(res=>{
   if(!active)return;
   if(res.error)throw res.error;
   const records=Array.isArray(res.data)?res.data as Spotlight[]:[];
   const unique=new Map<string,Spotlight>();
   for(const record of records){if(typeof record.slug==='string'&&/^[a-z0-9][a-z0-9-]{2,59}$/.test(record.slug)&&!unique.has(record.slug))unique.set(record.slug,record);}
   setSpotlights(orderRecommended([...unique.values()].map(p=>({...p,review_count:Number(p.review_count)||0,average_rating:p.average_rating===null?null:Number(p.average_rating),completed_orders:Number(p.completed_orders)||0}))).slice(0,6));setState('ready');
  }).catch(()=>{if(active)setState('error')});
  return()=>{active=false};
 },[]);
 const steps=mode==='buyer'?buyerSteps:sellerSteps;
 const skills=useMemo(()=>topics.slice(0,4),[]);
 return <>
   <section id="how" className="signature-process">
    <div className="shell">
     <div className="signature-section-heading"><div><span className="signature-section-eyebrow">01 / HOW IT WORKS</span><h2>{t('Санаанаас бодит ажил хүртэл.','A simpler way to create together.')}</h2><p>{t('Хайх, холбогдох, хамтран бүтээх — төвөггүй.', 'Less guesswork. More meaningful collaboration.')}</p></div><div className="signature-process-switch" role="group" aria-label={t('Хэрэглэгчийн төрөл','How it works for')}><button aria-pressed={mode==='buyer'} className={mode==='buyer'?'active':''} onClick={()=>setMode('buyer')}>{t('Захиалагчдад','For buyers')}</button><button aria-pressed={mode==='seller'} className={mode==='seller'?'active':''} onClick={()=>setMode('seller')}>{t('Freelancer-д','For freelancers')}</button></div></div>
     <div className="signature-step-grid">{steps.map(({index,mn,en:eng,descMn,descEn,Icon})=><article key={index} className="signature-step"><div className="signature-step-top"><span className="signature-step-icon"><Icon size={24}/></span><strong>{index}</strong></div><h3>{en?eng:mn}</h3><p>{en?descEn:descMn}</p><div className="signature-step-line"/></article>)}</div>
     <p className="signature-process-note"><ShieldCheck size={15}/>{t('Туршилтын хугацаанд бодит төлбөр, эскроу ашиглахгүй.','No real payments or escrow during the closed beta.')}</p>
    </div>
   </section>
   <section className="signature-spotlight shell" id="talent">
    <div className="signature-section-heading"><div><span className="signature-section-eyebrow">02 / THE PEOPLE BEHIND THE WORK</span><h2>{t('Бүтээлч хүмүүс. Бодит ур чадвар.','Meet the minds behind the work.')}</h2><p>{t('Нийтэд нээлттэй профайлтай, баталгаажуулсан бета оролцогчид л энд гарна.','Verified completed-order reviews shape recommendations. New freelancers remain discoverable.')}</p></div><Link href="/explore/" className="signature-text-link">{t('Бүх үйлчилгээг үзэх','Explore services')}<ArrowUpRight size={18}/></Link></div>
    {state==='loading'&&<div className="signature-spotlight-empty" role="status">{t('Бодит профайлуудыг ачаалж байна…','Loading live freelancer profiles…')}</div>}
    {state==='error'&&<div className="signature-spotlight-empty" role="status">{t('Одоогоор профайл ачаалж чадсангүй.','Live profiles are temporarily unavailable.')}</div>}
    {state==='ready'&&!spotlights.length&&<div className="signature-spotlight-empty">{t('Freelancer-үүдийн нийтэд нээлттэй профайл энд харагдана.','Published freelancer profiles will appear here.')} <Link href="/join/seller/">{t('Эхэлж нэгдэх','Join as a freelancer')}<ArrowRight size={15}/></Link></div>}
    {state==='ready'&&spotlights.length>0&&<div className="signature-people-grid">{spotlights.map((p,i)=><Link className="signature-person" key={p.slug} href={'/login/?mode=buyer&seller='+encodeURIComponent(p.slug)}><div className={'signature-person-avatar avatar-tone-'+(i%4)}><span>{p.display_name?.trim().slice(0,1).toLocaleUpperCase()||'H'}</span><i/></div><div className="signature-person-caption"><span>{p.category}</span><h3>{p.display_name}</h3><p>{p.headline||p.title}</p>{p.review_count>0&&p.average_rating!==null&&<div className="signature-review-score"><Star size={15} fill="currentColor"/><strong>{p.average_rating.toFixed(1)}</strong><small>({p.review_count} {t('баталгаажсан үнэлгээ','verified reviews')})</small></div>}<small>{t('Үйлчилгээний эхлэх үнэ','Services from')} <b>{formatPrice(p.price)}</b></small></div><span className="signature-person-arrow"><ArrowUpRight size={18}/></span></Link>)}</div>}
   </section>
   <section id="for-freelancers" className="signature-seller-band shell">
    <div className="signature-seller-text"><span className="signature-section-eyebrow">{t('БИЕ ДААСАН МЭРГЭЖИЛТНҮҮДЭД','FOR THE INDEPENDENT CREATOR')}</span><h2>{t('Ур чадвараа шинэ','Your skills deserve')}<br/><em>{t('боломжтой учруул.','a bigger stage.')}</em></h2><p>{t('Өөрийн нэрийн хуудастай бол. Үйлчилгээгээ багцал. Шинэ хүмүүстэй хамтар.','Build a storefront for your talent, create packages and connect with new clients.')}</p><Link href="/join/seller/" className="signature-cta-button">{t('Freelancer болж эхлэх','Become a freelancer')}<ArrowUpRight size={19}/></Link></div>
    <div className="signature-seller-art" aria-hidden="true"><div className="signature-art-window"><span className="signature-window-dots">● ● ●</span><div className="signature-art-line strong"/><div className="signature-art-line medium"/><div className="signature-art-row"><i/><i/><i/></div><div className="signature-art-badge"><Sparkles size={17}/> MADE TO CREATE</div></div><div className="signature-art-cube cube-one"/><div className="signature-art-cube cube-two"/></div>
   </section>
   <section className="signature-partner shell">
    <div className="signature-partner-inner"><div className="signature-partner-copy"><span className="signature-section-eyebrow">HUSTLE / PARTNERS</span><h2>{t('Холбоогоо боломж болго.','Good connections make great things happen.')}</h2><p>{t('Бүтээлч мэргэжилтнүүдийг платформтой танилцуулж, түншийн хөтөлбөрт оролцоорой. Урамшуулал бета туршилтад тооцооллын хэлбэртэй.', 'Introduce skilled freelancers to the marketplace. Referral rewards are simulated during beta, not paid out.')}</p><Link className="signature-partner-link" href="/buyer/">{t('Түншийн мэдээлэл үзэх','Explore referrals')}<ArrowUpRight size={16}/></Link></div><div className="signature-partner-stats"><div><strong>1%</strong><span>{t('Үндсэн түнш','Standard partner')}</span></div><div><strong>2%</strong><span>{t('Идэвхтэй түнш','Active partner')}</span></div><div><strong>10%</strong><span>{t('Платформын шимтгэл','Platform commission')}</span></div></div></div>
   </section>
 </>;
}
