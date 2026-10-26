'use client';
import {BriefcaseBusiness,ImagePlus,MessageCircle,Plus,Send,Sparkles} from 'lucide-react';
import {brandLogoFor,creativeToolFor} from '../lib/marketplace/creative-tools';
import {categoryLabel} from '../lib/marketplace/taxonomy';

/* V50 — live buyer-facing preview of the seller's profile. It renders from the unsaved
   draft, so every keystroke shows up immediately (no iframe, no save-to-see). Empty
   parts render as dashed "add this" blocks that jump back to the right editor section. */
export type PreviewSection='about'|'photos'|'skills'|'projects'|'services'|'publish';
export type PreviewDraft={display_name:string;headline:string;bio:string;skills:string};
export type PreviewItem={id:string;title:string;url?:string};
export type PreviewService={id:string;title:string;title_en?:string|null;category:string;price:number;status:string};

export const splitSkills=(s:string)=>s.split(',').map(x=>x.trim()).filter(Boolean);
const money=(n:number,en:boolean)=>new Intl.NumberFormat(en?'en-US':'mn-MN').format(Math.round(n||0))+' ₮';

export default function SellerProfilePreview({draft,avatarUrl,coverUrl,coverFocusY,items,tools,services,en,device,onJump}:{
 draft:PreviewDraft;avatarUrl:string|null;coverUrl:string|null;coverFocusY:number;items:PreviewItem[];tools:string[];services:PreviewService[];
 en:boolean;device:'desktop'|'mobile';onJump:(s:PreviewSection)=>void
}){
 const t=(mn:string,english:string)=>en?english:mn;
 const skills=splitSkills(draft.skills);
 const name=draft.display_name.trim()||t('Таны нэр','Your name');
 const initial=Array.from(draft.display_name.trim())[0]?.toLocaleUpperCase()||'H';
 const live=services.filter(s=>s.status==='published');
 const Ghost=({to,children}:{to:PreviewSection;children:React.ReactNode})=><button type="button" className="spv-ghost" onClick={()=>onJump(to)}><Plus size={15} aria-hidden="true"/>{children}</button>;
 return <article className={'spv spv-'+device} aria-label={t('Buyer-ийн харах профайл','Profile as buyers see it')}>
  <div className="spv-cover">
   {coverUrl?<img src={coverUrl} alt="" style={{objectPosition:'center '+coverFocusY+'%'}}/>:<button type="button" className="spv-cover-empty" onClick={()=>onJump('photos')}><ImagePlus size={17} aria-hidden="true"/>{t('Cover зураг нэмэх','Add a cover photo')}</button>}
  </div>
  <header className="spv-id">
   <button type="button" className={'spv-avatar'+(avatarUrl?'':' is-empty')} onClick={()=>onJump('photos')} aria-label={t('Профайл зураг засах','Edit profile photo')}>{avatarUrl?<img src={avatarUrl} alt=""/>:<span>{initial}</span>}</button>
   <div className="spv-id-text">
    <h2 className={draft.display_name.trim()?'':'is-placeholder'}>{name}</h2>
    {draft.headline.trim()?<p>{draft.headline}</p>:<Ghost to="about">{t('Мэргэжлээ нэг өгүүлбэрээр бичих','Add a one-line headline')}</Ghost>}
   </div>
   <div className="spv-cta" aria-hidden="true">
    <span className="spv-btn primary"><Send size={15}/>{t('Захиалга илгээх','Send an order')}</span>
    <span className="spv-btn"><MessageCircle size={15}/>{t('Мессеж бичих','Message')}</span>
   </div>
  </header>
  <div className="spv-body">
   <section>
    <h3>{t('Танилцуулга','About')}</h3>
    {draft.bio.trim()?<p className="spv-bio">{draft.bio}</p>:<Ghost to="about">{t('Хэн бэ, юу хийдэг вэ, ямар үр дүн өгдөг вэ гэдгээ бичих','Say who you are, what you do and the results you deliver')}</Ghost>}
   </section>
   <section>
    <h3>{t('Ур чадвар','Skills')}</h3>
    {skills.length?<ul className="spv-chips">{skills.map(s=><li key={s}>{s}</li>)}</ul>:<Ghost to="skills">{t('Ур чадвар нэмэх','Add skills')}</Ghost>}
    {tools.length>0&&<ul className="spv-tools">{tools.map(k=>{const tool=creativeToolFor(k);const logo=brandLogoFor(k);return <li key={k} title={tool?.name||k}>{logo?<img src={logo} alt="" width={22} height={22}/>:<Sparkles size={16}/>}<span>{tool?.name||k}</span></li>})}</ul>}
   </section>
   <section>
    <h3>{t('Бүтээлүүд','Portfolio')}{items.length>0&&<small>{items.length}</small>}</h3>
    {items.length?<ul className="spv-work">{items.map(item=><li key={item.id}><div>{item.url?<img src={item.url} alt=""/>:<ImagePlus size={20} aria-hidden="true"/>}</div><span>{item.title}</span></li>)}</ul>:<Ghost to="projects">{t('Шилдэг 3 бүтээлээ нэмэх','Add your best 3 projects')}</Ghost>}
   </section>
   <section>
    <h3>{t('Үйлчилгээ','Services')}{live.length>0&&<small>{live.length}</small>}</h3>
    {live.length?<ul className="spv-services">{live.map(s=><li key={s.id}><span className="spv-svc-icon"><BriefcaseBusiness size={16} aria-hidden="true"/></span><div><b>{en&&s.title_en?s.title_en:s.title}</b><small>{categoryLabel(s.category,en)}</small></div><em>{t('Эхлэх үнэ','From')} {money(s.price,en)}</em></li>)}</ul>:<Ghost to="services">{t('Нийтлэгдсэн үйлчилгээ алга — үйлчилгээ нэмэх','No published services yet — add one')}</Ghost>}
   </section>
  </div>
 </article>;
}
