'use client';
import Link from 'next/link';
import {ArrowUpRight,Bot,ChartNoAxesCombined,Clapperboard,Clock4,Workflow,BriefcaseBusiness,Sparkles} from 'lucide-react';
import '../app/business-solutions.css';
export default function BusinessSolutions({en}:{en:boolean}){
 const t=(mn:string,english:string)=>en?english:mn;
 const cards=[
  {id:'grow',mn:'Илүү олон хэрэглэгчтэй болох',eng:'Win more customers',descMn:'Маркетинг · Контент · Борлуулалт',descEn:'Marketing · Content · Growth',need:'Манай бизнесийн борлуулалт, захиалга бага байна',englishNeed:'We need more sales and bookings',Icon:ChartNoAxesCombined},
  {id:'automate',mn:'Гар ажиллагаа, цаг хэмнэх',eng:'Automate repetitive work',descMn:'AI · CRM · Автоматжуулалт',descEn:'AI · CRM · Automation',need:'Манай бизнесийн давтагддаг ажлыг автоматжуулах хэрэгтэй байна',englishNeed:'I need to automate our repetitive business processes',Icon:Workflow},
  {id:'content',mn:'Брэнд ба контентоо өсгөх',eng:'Build content and brand',descMn:'Брэнд · Видео · Контент',descEn:'Brand · Video · Content',need:'Манай бизнесийн контент, Reels болон брэндийг сайжруулах хэрэгтэй',englishNeed:'We need better brand identity and social content',Icon:Clapperboard},
  {id:'launch',mn:'Онлайн үйлчилгээ эхлүүлэх',eng:'Launch online',descMn:'Вэб · UI/UX · Интеграц',descEn:'Web · UI/UX · Integrations',need:'Манай бизнест вебсайт болон онлайн захиалгын систем хэрэгтэй байна',englishNeed:'Our business needs a website and online booking',Icon:BriefcaseBusiness}
 ];
 return <section className="business-solutions-section" aria-labelledby="business-solutions-heading">
  <div className="shell business-solutions-inner">
   <div className="business-intro"><div><span className="business-overline">{t('Бизнесийн шийдэл','Business solutions')}</span><h2 id="business-solutions-heading">{t('Бизнесээ','Make business')}<br/><em>{t('урагшлуул.','move forward.')}</em></h2><p>{t('Зорилгодоо хүрэх ур чадварыг ол.','Find expertise for your next move.')}</p></div>
   <Link className="business-solution-main-cta" href="/solutions/?audience=business">{t('Шийдлээ олох','Find a solution')}<ArrowUpRight size={17}/></Link></div>
   <div className="business-solution-grid">{cards.map(({id,mn,eng,descMn,descEn,need,englishNeed,Icon},i)=><Link className="business-solution-card" href={'/solutions/?audience=business&q='+encodeURIComponent(en?englishNeed:need)} key={id}>
    <div className="business-card-top"><span className="business-solution-icon"><Icon size={25} strokeWidth={1.7}/></span><small>0{i+1}</small></div>
    <h3>{en?eng:mn}</h3><p>{en?descEn:descMn}</p>
    <span className="business-card-action">{t('Боломжуудыг харах','Explore solutions')} <ArrowUpRight size={16}/></span>
   </Link>)}</div>

  </div>
 </section>;
}
