'use client';
import {useEffect,useMemo,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {ArrowRight,ArrowUpRight,Building2,Check,ClipboardCopy,Lightbulb,Search,Sparkles,UserRound,Workflow} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import {buildProjectBrief,classifyNeed,matchingPublished,problemExamples,type Audience,type PublishedMatch} from '../lib/marketplace/solution-finder';
import '../app/solution-finder.css';

export default function SolutionFinder({compact=false,en:language=false}:{compact?:boolean;en?:boolean}){
 const [en,setEn]=useState(language);
 const [audience,setAudience]=useState<Audience>('business');
 const [query,setQuery]=useState('');
 const [submitted,setSubmitted]=useState('');
 const [budget,setBudget]=useState(''),[timeline,setTimeline]=useState('');
 const [catalog,setCatalog]=useState<PublishedMatch[]>([]);
 const [catalogState,setCatalogState]=useState<'loading'|'ready'|'error'>('loading');
 const [copied,setCopied]=useState(false);
 const t=(mn:string,english:string)=>en?english:mn;
 useEffect(()=>{
  let active=true;
  setEn(localStorage.getItem('hustle-language')==='en'||language);
  try{const saved=localStorage.getItem('hustle-buyer-audience');if(saved==='personal'||saved==='business')setAudience(saved)}catch{}
  const params=new URLSearchParams(location.search);
  if(params.get('audience')==='business'||params.get('audience')==='personal')setAudience(params.get('audience') as Audience);
  const need=params.get('q')||'';
  if(need.trim()){setQuery(need.slice(0,1200));setSubmitted(need.slice(0,1200))}
  void marketplaceClient().then(db=>db.rpc('marketplace_catalog')).then(res=>{
   if(!active)return;
   if(res.error)throw res.error;
   setCatalog(Array.isArray(res.data)?res.data as PublishedMatch[]:[]);
   setCatalogState('ready');
  }).catch(()=>{if(active)setCatalogState('error')});
  return()=>{active=false};
 },[language]);
 const outcome=useMemo(()=>classifyNeed(submitted),[submitted]);
 const brief=useMemo(()=>buildProjectBrief(submitted,audience,en?'en':'mn',budget,timeline),[submitted,audience,en,budget,timeline]);
 const setType=(type:Audience)=>{setAudience(type);try{localStorage.setItem('hustle-buyer-audience',type)}catch{}};
 const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();if(query.trim().length<5)return;setSubmitted(query.trim().slice(0,1200));setCopied(false)};
 const ask=(example:string)=>{setQuery(example);setSubmitted(example);setCopied(false)};
 const copy=async()=>{try{await navigator.clipboard.writeText(brief);setCopied(true)}catch{setCopied(false)}};
 return <section className={'solution-finder '+(compact?'finder-compact':'')} aria-labelledby="hustle-finder-title">
  <div className="solution-shell">
   {!compact&&<div className="solution-top"><Link href="/" className="solution-brand">hustle<span>✳</span>.mn</Link><Link href="/explore/">{t('Бүх үйлчилгээг үзэх','Browse all services')} <ArrowUpRight size={16}/></Link></div>}
   <div className="finder-heading"><div className="finder-eyebrow"><Sparkles size={15}/>{t('HUSTLE SMART FINDER · BETA','HUSTLE SMART FINDER · BETA')}</div>
    <h1 id="hustle-finder-title">{t('Ямар асуудал шийдэх хэрэгтэй байна?','What are you trying to solve?')}</h1>
    <p>{t('Үйлчилгээний нэр мэдэх шаардлагагүй. Зорилгоо өөрийн үгээр бич, бид боломжит шийдэл болон бодит нийтлэгдсэн freelancer-ийн үйлчилгээг харуулна.','No need to know the service name. Describe your challenge and explore possible solutions and real published services.')}</p>
   </div>
   <div className="finder-audience" role="group" aria-label={t('Төслийн төрөл','Project context')}>
    <button type="button" aria-pressed={audience==='business'} onClick={()=>setType('business')}><Building2 size={18}/>{t('Бизнес / байгууллага','Business / organization')}</button>
    <button type="button" aria-pressed={audience==='personal'} onClick={()=>setType('personal')}><UserRound size={18}/>{t('Хувийн төсөл','Personal project')}</button>
   </div>
   <form className="finder-form" onSubmit={submit} role="search">
    <label htmlFor="hustle-need">{t('Хэрэгцээгээ тайлбарлана уу','Describe what you need')}</label>
    <textarea id="hustle-need" name="q" rows={compact?2:3} minLength={5} maxLength={1200} required value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('Жишээ: Манай рестораны захиалгыг нэмэгдүүлэх хэрэгтэй. Хаанаас эхлэхээ мэдэхгүй байна.','Example: We want more restaurant bookings but do not know where to start.')}/>
    <div className="finder-form-foot"><span><Workflow size={15}/>{t('Монгол · Latin · English · Төлбөргүй beta','Mongolian · Latin · English · Free beta')}</span><button type="submit" disabled={query.trim().length<5}>{t('Шийдэл олох','Find solutions')} <ArrowRight size={18}/></button></div>
   </form>
   <div className="finder-prompts" aria-label={t('Түгээмэл асуудлын жишээ','Popular challenges')}>
    {problemExamples.map(item=><button type="button" key={item.key} onClick={()=>ask(en?item.exampleEn:item.exampleMn)}>{en?item.mn===item.en?item.en:item.en:item.mn} <ArrowUpRight size={14}/></button>)}
   </div>
   {submitted&&<div className="finder-results" id="solution-results" aria-live="polite">
    <div className="finder-result-heading"><div><span className="finder-eyebrow"><Lightbulb size={15}/>{t('ТАНЫ БОЛОМЖИТ ЧИГЛЭЛ','POSSIBLE NEXT STEPS')}</span>
     <h2>{en?outcome.en:outcome.mn}</h2><p>{en?outcome.enWhy:outcome.mnWhy}</p></div><span className="finder-result-count">3 {t('шийдэл','approaches')}</span></div>
    <div className="finder-solution-grid">{outcome.solutions.map((idea,i)=>{
     const matches=matchingPublished(catalog,idea);
     return <article className="finder-solution-card" key={idea.id}>
      <span className="finder-number">0{i+1}</span><h3>{en?idea.en:idea.mn}</h3><p>{en?idea.whyEn:idea.whyMn}</p>
      {matches.length>0?<div className="finder-real-matches"><strong><Check size={15}/>{t('Нийтлэгдсэн үйлчилгээ','Published services')}</strong>{matches.map(service=><Link key={service.id} href={'/listing/?id='+encodeURIComponent(service.id)}>{en&&service.title_en?service.title_en:service.title}<ArrowUpRight size={15}/></Link>)}</div>
       :<div className="finder-no-match">{catalogState==='loading'?t('Бодит үйлчилгээг хайж байна…','Checking available services…'):catalogState==='error'?t('Одоогоор каталогт холбогдож чадсангүй.','Live catalog is temporarily unavailable.'):t('Одоогоор энэ чиглэлийн нийтлэгдсэн үйлчилгээ алга.','No published services in this area yet.')}</div>}
     </article>;
    })}</div>
    <div className="finder-brief">
     <div><span className="finder-eyebrow"><ClipboardCopy size={15}/>{t('ТӨСЛИЙН ХҮСЭЛТ','PROJECT BRIEF')}</span><h3>{t('Freelancer-т ойлгомжтой шаардлага бэлдье','Turn your challenge into a clear brief')}</h3></div>
     <div className="finder-brief-fields"><label>{t('Төсөв (сонголттой)','Budget (optional)')}<input value={budget} onChange={e=>setBudget(e.target.value.slice(0,80))} maxLength={80} placeholder={t('Жишээ: 300,000–500,000 ₮','e.g., 300,000–500,000 MNT')}/></label><label>{t('Хугацаа (сонголттой)','Timeline (optional)')}<input value={timeline} onChange={e=>setTimeline(e.target.value.slice(0,80))} maxLength={80} placeholder={t('Жишээ: 2 долоо хоног','e.g., 2 weeks')}/></label></div>
     <pre className="finder-brief-preview">{brief}</pre>
     <div className="finder-brief-actions"><button type="button" onClick={()=>void copy()}><ClipboardCopy size={16}/>{copied?t('Хуулсан','Copied'):t('Хүсэлт хуулах','Copy project brief')}</button><Link href={'/explore/?q='+encodeURIComponent(submitted)}>{t('Freelancer хайх','Browse freelancers')} <ArrowUpRight size={16}/></Link></div>
     <p className="finder-disclosure">{t('Энэ beta хувилбар нь дүрэмд суурилсан ухаалаг чиглүүлэлт юм. Генератив AI зөвлөх хараахан идэвхжээгүй; санал нь баталгаатай бизнесийн үр дүн гэсэн үг биш.','This beta uses rule-based guidance, not a connected generative AI advisor. Suggestions do not guarantee a business outcome.')}</p>
    </div>
   </div>}
  </div>
 </section>;
}
