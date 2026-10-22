'use client';
import Link from 'next/link';
import {ArrowUpRight,Bot,ChartNoAxesCombined,Clapperboard,Clock4,Workflow,Building2,BriefcaseBusiness,Sparkles} from 'lucide-react';
import '../app/business-solutions.css';
export default function BusinessSolutions({en}:{en:boolean}){
 const t=(mn:string,english:string)=>en?english:mn;
 const cards=[
  {id:'grow',mn:'Илүү олон хэрэглэгчтэй болох',eng:'Win more customers',descMn:'Зорилтот маркетинг, контент, онлайн захиалгын урсгал.',descEn:'Marketing, content and an easier booking journey.',need:'Манай бизнесийн борлуулалт, захиалга бага байна',englishNeed:'We need more sales and bookings',Icon:ChartNoAxesCombined},
  {id:'automate',mn:'Гар ажиллагаа, цаг хэмнэх',eng:'Automate repetitive work',descMn:'CRM, чатбот, захиалга ба тайлангийн автоматжуулалт.',descEn:'CRM, chatbots, order intake and reporting workflows.',need:'Манай бизнесийн давтагддаг ажлыг автоматжуулах хэрэгтэй байна',englishNeed:'I need to automate our repetitive business processes',Icon:Workflow},
  {id:'content',mn:'Брэнд ба контентоо өсгөх',eng:'Build content and brand',descMn:'Фото, Reels, AI-assisted контент ба брэндийн шийдэл.',descEn:'Photo, Reels, AI-assisted content and visual identity.',need:'Манай бизнесийн контент, Reels болон брэндийг сайжруулах хэрэгтэй',englishNeed:'We need better brand identity and social content',Icon:Clapperboard},
  {id:'launch',mn:'Онлайн үйлчилгээ эхлүүлэх',eng:'Launch online',descMn:'Бизнесийн вебсайт, UI/UX болон интеграц.',descEn:'Business website, UX and connected tools.',need:'Манай бизнест вебсайт болон онлайн захиалгын систем хэрэгтэй байна',englishNeed:'Our business needs a website and online booking',Icon:BriefcaseBusiness}
 ];
 return <section className="business-solutions-section" aria-labelledby="business-solutions-heading">
  <div className="shell business-solutions-inner">
   <div className="business-intro"><div><span className="business-overline"><Building2 size={15}/> HUSTLE / BUSINESS SOLUTIONS</span><h2 id="business-solutions-heading">{t('Танд freelancer биш,','You don’t need to know the role.')}<br/><em>{t('зөв шийдэл хэрэгтэй.','Start with the problem.')}</em></h2><p>{t('Бизнесийн асуудлаа өөрийн үгээр тайлбарлаарай. Хамгийн тохирох ажлын чиглэлээ олж, бодит freelancer-тэй холбогдоорой.','Describe what is holding your business back. Explore practical solutions and connect with real freelancers.')}</p></div>
   <Link className="business-solution-main-cta" href="/solutions/?audience=business">{t('Шийдлээ олох','Find a solution')}<ArrowUpRight size={17}/></Link></div>
   <div className="business-solution-grid">{cards.map(({id,mn,eng,descMn,descEn,need,englishNeed,Icon},i)=><Link className="business-solution-card" href={'/solutions/?audience=business&q='+encodeURIComponent(en?englishNeed:need)} key={id}>
    <div className="business-card-top"><span className="business-solution-icon"><Icon size={25} strokeWidth={1.7}/></span><small>0{i+1}</small></div>
    <h3>{en?eng:mn}</h3><p>{en?descEn:descMn}</p>
    <span className="business-card-action">{t('Боломжуудыг харах','Explore solutions')} <ArrowUpRight size={16}/></span>
   </Link>)}</div>
   <div className="business-next-strip"><div className="business-next-cell"><Bot size={21}/><span><strong>{t('AI ба автоматжуулалт','AI & automation')}</strong><small>{t('Бодит ажилд хэрэгтэй мэргэжилтнүүд','Specialists for real business workflows')}</small></span></div>
    <div className="business-next-cell"><Clock4 size={21}/><span><strong>{t('Нэг удаагийн ба сарын үйлчилгээ','One-time & monthly needs')}</strong><small>{t('Сарын гэрээний удирдлагыг дараагийн хувилбарт нэмнэ','Monthly agreement management is coming later')}</small></span></div>
    <Link href="/explore/?category=ai">{t('AI үйлчилгээ харах','Browse AI services')}<Sparkles size={16}/></Link>
   </div>
  </div>
 </section>;
}
