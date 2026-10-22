'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,ArrowUpRight,Building2,Check,ChevronRight,Compass,FileText,LockKeyhole,Search,Sparkles,UserRound,X,Workflow,TrendingUp,Monitor,Clapperboard,Palette,ChartNoAxesCombined,PenLine,GraduationCap,Ellipsis} from 'lucide-react';
import {buildProjectBrief,classifyNeed,type Audience} from '../lib/marketplace/solution-finder';
import {guidedGoals,guidedIndustries,guidedProblem,guidedFinderHref,type GuidedGoalKey} from '../lib/marketplace/guided-entry';
import '../app/guided-entry.css';

const icons={growth:TrendingUp,automation:Workflow,web:Monitor,content:Clapperboard,brand:Palette,analytics:ChartNoAxesCombined,design:Palette,skills:Sparkles,'personal-it':Monitor,video:Clapperboard,writing:PenLine,other:Ellipsis};
const stages=[1,2,3] as const;

export default function GuidedEntry({en}:{en:boolean}){
 const [open,setOpen]=useState(false);
 const [audience,setAudience]=useState<Audience>('business');
 const [step,setStep]=useState<1|2|3>(1);
 const [goalKey,setGoalKey]=useState<GuidedGoalKey>('growth');
 const [notes,setNotes]=useState(''),[budget,setBudget]=useState(''),[timeline,setTimeline]=useState(''),[industry,setIndustry]=useState('');
 const [showBrief,setShowBrief]=useState(false),[copied,setCopied]=useState(false);
 const panelRef=useRef<HTMLDivElement>(null),returnFocusRef=useRef<HTMLElement|null>(null);
 const t=(mn:string,english:string)=>en?english:mn;
 const goals=guidedGoals[audience];
 const goal=useMemo(()=>goals.find(g=>g.key===goalKey)||goals[0],[goals,goalKey]);
 const problem=guidedProblem(goal,notes,en);
 const outcome=classifyNeed(problem);
 const finderHref=guidedFinderHref(audience,goal,notes,en,budget,timeline);
 const brief=buildProjectBrief(problem,audience,en?'en':'mn',budget,timeline);
 const start=(type:Audience)=>{
  returnFocusRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  setAudience(type);setGoalKey(guidedGoals[type][0].key);
  setStep(1);setNotes('');setBudget('');setTimeline('');setIndustry('');
  setShowBrief(false);setCopied(false);setOpen(true);
  try{localStorage.setItem('hustle-buyer-audience',type)}catch{}
 };
 const close=()=>{setOpen(false)};
 const advance=()=>{if(step===1){setStep(2);return}if(step===2){setStep(3);setShowBrief(false)}};
 useEffect(()=>{
  if(!open)return;
  const before=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const focus=()=>{const list=panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex="0"]');list?.[0]?.focus()};
  requestAnimationFrame(focus);
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();setOpen(false);return}
   if(event.key!=='Tab'||!panelRef.current)return;
   const focusables=Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex="0"]')).filter(n=>n.getClientRects().length>0);
   if(!focusables.length)return;
   const first=focusables[0],last=focusables[focusables.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  };
  document.addEventListener('keydown',onKey);
  return()=>{document.body.style.overflow=before;document.removeEventListener('keydown',onKey);returnFocusRef.current?.focus()};
 },[open]);
 const copyBrief=async()=>{try{await navigator.clipboard.writeText(brief);setCopied(true)}catch{setCopied(false)}};
 return <>
  <div className="guided-entry-intro" aria-labelledby="guided-entry-title">
   <div className="guided-entry-eyebrow"><Compass size={14}/>{t('ТАНД ТОХИРОХ ЗАМЫГ СОНГО','CHOOSE YOUR PATH')}</div>
   <h2 id="guided-entry-title">{t('Hustle-г юунд ашиглах вэ?','How will you use Hustle?')}</h2>
   <div className="guided-entry-choices">
    <button type="button" className="guided-entry-choice" onClick={()=>start('personal')} aria-haspopup="dialog">
     <span className="guided-entry-symbol"><UserRound size={24} strokeWidth={1.8}/></span><span className="guided-entry-choice-copy"><strong>{t('Хувь хүн','For myself')}</strong><small>{t('Хувийн санаа, төсөл, бүтээлч ажил','Personal projects & creative work')}</small></span><ArrowUpRight size={20}/>
    </button>
    <button type="button" className="guided-entry-choice guided-entry-business" onClick={()=>start('business')} aria-haspopup="dialog">
     <span className="guided-entry-symbol"><Building2 size={24} strokeWidth={1.8}/></span><span className="guided-entry-choice-copy"><strong>{t('Бизнес / байгууллага','For my business')}</strong><small>{t('Борлуулалт, AI, автоматжуулалт','Growth, AI & automation')}</small></span><ArrowUpRight size={20}/>
    </button>
   </div>
   <p className="guided-entry-assurance"><LockKeyhole size={13}/>{t('Үнэгүй чиглүүлэлт · Бүртгэл шаардлагагүй · Дараа нь сонголтоо сольж болно','Free guidance · No sign-up to explore · Switch anytime')}</p>
  </div>
  {open&&typeof document!=='undefined'&&createPortal(<div className="guided-modal-backdrop" onPointerDown={e=>{if(e.target===e.currentTarget)close()}}>
   <div className="guided-modal" ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="guided-dialog-title" aria-describedby="guided-dialog-description">
    <div className="guided-modal-header">
     <div className="guided-modal-mark"><span>h<span>✳</span></span><small>HUSTLE / GUIDED DISCOVERY</small></div>
     <button type="button" className="guided-modal-close" aria-label={t('Хаах','Close')} onClick={close}><X size={19}/></button>
    </div>
    <div className="guided-modal-progress" aria-label={t('Чиглүүлэлтийн алхмууд','Guide progress')}>{stages.map((n)=><div key={n} className={'guided-progress-segment '+(step>=n?'active':'')}/>)}</div>
    <div className="guided-modal-body">
     <div className="guided-step-meta"><span>{audience==='business'?<Building2 size={15}/>:<UserRound size={15}/>} {audience==='business'?t('Бизнесийн хэрэгцээ','Business needs'):t('Хувийн хэрэгцээ','Personal needs')}</span><span>{step} / 3</span></div>
     {step===1&&<>
      <span className="guided-step-eyebrow">{t('АЛХАМ 01 — ЗОРИЛГО','STEP 01 — YOUR GOAL')}</span>
      <h2 id="guided-dialog-title">{audience==='business'?t('Бизнесийнхээ юуг сайжруулахыг хүсэж байна?','What would you like to improve?'):t('Ямар төрлийн ажил хийлгэх вэ?','What would you like help with?')}</h2>
      <p id="guided-dialog-description">{t('Нэг чиглэл сонгоорой. Нарийн шаардлагаа дараагийн алхамд бичиж болно.','Choose one direction. You can explain the details next.')}</p>
      <div className="guided-goals">{goals.map(g=>{
       const Icon=icons[g.key];const checked=goal.key===g.key;
       return <button type="button" className={'guided-goal '+(checked?'selected':'')} aria-pressed={checked} onClick={()=>{setGoalKey(g.key);setNotes('')}} key={g.key}>
        <span className="guided-goal-icon"><Icon size={20}/></span><span>{en?g.en:g.mn}</span>{checked&&<Check size={18} className="guided-goal-check"/>}
       </button>;
      })}</div>
     </>}
     {step===2&&<>
      <span className="guided-step-eyebrow">{t('АЛХАМ 02 — ХЭРЭГЦЭЭ','STEP 02 — YOUR BRIEF')}</span>
      <h2 id="guided-dialog-title">{t('Асуудлаа өөрийн үгээр тайлбарлаарай','Tell us about your challenge')}</h2>
      <p id="guided-dialog-description">{t('Тодорхой биш байсан ч болно. Таны өгсөн мэдээллээр боломжит шийдлүүдийг чиглүүлнэ.','It is okay if you are still figuring it out. We will suggest approaches based on your description.')}</p>
      {audience==='business'&&<label className="guided-label" htmlFor="guided-industry">{t('Бизнесийн салбар (сонголттой)','Business industry (optional)')}<select id="guided-industry" value={industry} onChange={e=>setIndustry(e.target.value)}>{guidedIndustries.map(x=><option key={x.value} value={x.value}>{en?x.en:x.mn}</option>)}</select></label>}
      <label className="guided-label" htmlFor="guided-need">{t('Юуг шийдэхийг хүсэж байна вэ?','What needs to change?')}<textarea id="guided-need" rows={4} maxLength={1200} value={notes} onChange={e=>setNotes(e.target.value)} placeholder={en?goal.exampleEn:goal.exampleMn}/></label>
      <div className="guided-field-grid">
       <label className="guided-label" htmlFor="guided-budget">{t('Төсөв (сонголттой)','Budget (optional)')}<input id="guided-budget" maxLength={80} value={budget} onChange={e=>setBudget(e.target.value)} placeholder={t('Ж: 500,000 ₮','e.g. 500,000 MNT')}/></label>
       <label className="guided-label" htmlFor="guided-timeline">{t('Хугацаа (сонголттой)','Timeline (optional)')}<input id="guided-timeline" maxLength={80} value={timeline} onChange={e=>setTimeline(e.target.value)} placeholder={t('Ж: 2 долоо хоног','e.g. 2 weeks')}/></label>
      </div>
      <p className="guided-inline-hint"><Sparkles size={15}/>{t('Хэрэв шаардлагаа сайн мэдэхгүй бол жишээ өгүүлбэрээр үргэлжилж болно.','You can leave the description blank and continue with the suggested example.')}</p>
     </>}
     {step===3&&<>
      <span className="guided-step-eyebrow">{t('АЛХАМ 03 — ШИЙДЭЛ','STEP 03 — POSSIBLE SOLUTIONS')}</span>
      <h2 id="guided-dialog-title">{en?outcome.en:outcome.mn}</h2>
      <p id="guided-dialog-description">{en?outcome.enWhy:outcome.mnWhy}</p>
      <div className="guided-recommendations">
       {outcome.solutions.map((solution,index)=><div className="guided-recommendation" key={solution.id}>
        <span className="guided-rec-index">0{index+1}</span><div><strong>{en?solution.en:solution.mn}</strong><p>{en?solution.whyEn:solution.whyMn}</p></div><Check size={18}/>
       </div>)}
      </div>
      <div className="guided-next-summary"><FileText size={19}/><div><strong>{t('Төслийн хүсэлтээ бэлдлээ','Your project brief is ready')}</strong><p>{t('Шийдэл үзэх хэсэгт бодит нийтлэгдсэн freelance үйлчилгээтэй холбогдоно.','Continue to see real published freelancer services matched to your challenge.')}</p></div></div>
      <button type="button" className="guided-brief-toggle" aria-expanded={showBrief} onClick={()=>setShowBrief(v=>!v)}>{t('Төслийн хүсэлт харах','Preview project brief')} <ChevronRight size={16}/></button>
      {showBrief&&<div className="guided-brief-exposed"><pre>{brief}</pre><button type="button" onClick={()=>void copyBrief()}>{copied?t('Хуулсан ✓','Copied ✓'):t('Хүсэлт хуулах','Copy brief')}</button></div>}
     </>}
    </div>
    <div className="guided-modal-footer">
     {step===1?<button type="button" className="guided-back" onClick={close}><ArrowLeft size={16}/>{t('Болих','Cancel')}</button>:<button type="button" className="guided-back" onClick={()=>{setStep(step===3?2:1);setShowBrief(false)}}><ArrowLeft size={16}/>{t('Буцах','Back')}</button>}
     <div className="guided-modal-footer-actions">
      {step===3?<><Link className="guided-secondary-link" href={'/explore/'} onClick={close}>{t('Бүх үйлчилгээ','All services')}</Link><Link className="guided-next" href={finderHref} onClick={close}>{t('Freelancer ба шийдэл харах','View real solutions')}<ArrowUpRight size={18}/></Link></>
      :<button type="button" className="guided-next" onClick={advance}>{step===1?t('Үргэлжлүүлэх','Continue'):t('Боломжит шийдэл харах','See solutions')} <ArrowRight size={17}/></button>}
     </div>
    </div>
    <div className="guided-modal-bottomline">{t('Smart Finder beta нь дүрэмд суурилсан чиглүүлэлт; бодит AI загвар холбогдоогүй.','Smart Finder beta uses rule-based guidance, not a connected AI model.')}</div>
   </div>
  </div>,document.body)}
 </>;
}
