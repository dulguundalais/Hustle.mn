import Link from 'next/link';
import {ArrowUpRight,Compass,ShieldCheck} from 'lucide-react';
import '../app/v20-footer.css';
const columns=[
 {mn:'Marketplace',en:'Marketplace',links:[['/explore/','Үйлчилгээ хайх','Browse services'],['/#popular-categories','Ангиллууд','Categories'],['/#how','Хэрхэн ажилладаг','How it works'],['/about/','Бидний тухай','About Hustle']]},
 {mn:'Захиалагчдад',en:'For buyers',links:[['/buyers/','Хэрхэн захиалах','How to buy'],['/explore/','Үнийн багцууд','Pricing packages'],['/buyer/','Миний захиалга','My orders'],['/faq/','Түгээмэл асуултууд','FAQ']]},
 {mn:'Freelancer-үүдэд',en:'For freelancers',links:[['/join/seller/','Freelancer болох','Start selling'],['/freelancers/','Freelancer гарын авлага','Seller guide'],['/seller-studio/','Seller Studio','Seller Studio'],['/referrals/','Түншлэлийн хөтөлбөр','Referral partners']]},
 {mn:'Мэдээлэл & Тусламж',en:'Company & help',links:[['/about/','Бидний тухай','About us'],['/contact/','Тусламж авах','Contact & support'],['/terms/','Үйлчилгээний нөхцөл','Terms of use'],['/privacy/','Нууцлалын бодлого','Privacy policy'],['/cookies/','Cookie Policy','Cookie policy']]}
] as const;
export default function PremiumFooter({en}:{en:boolean}){
 const t=(mn:string,english:string)=>en?english:mn;
 return <footer className="hustle-premium-footer">
  <div className="footer-callout shell">
   <div><span className="footer-eyebrow">HUSTLE / YOUR NEXT PROJECT</span><h2>{t('Санаагаа бодит болгох цаг.','Make what matters, together.')}</h2><p>{t('Төслөө эхлүүлэхэд хэрэгтэй ур чадварыг эндээс олоорой.','Discover the people who can bring your next idea to life.')}</p></div>
   <div className="footer-callout-actions"><Link href="/explore/" className="footer-main-cta">{t('Үйлчилгээ хайх','Explore services')}<ArrowUpRight size={18}/></Link><Link href="/join/seller/" className="footer-outline-cta">{t('Freelancer болох','Become a freelancer')}</Link></div>
  </div>
  <div className="shell footer-columns">
   <div className="footer-brand"><Link href="/" className="footer-logo">hustle<span>✳</span><small>mn</small></Link><p>{t('Монгол ур чадварыг шинэ боломжтой холбох бүтээлч үйлчилгээний платформ.','Connecting Mongolian talent with meaningful creative opportunities.')}</p><div className="footer-status"><ShieldCheck size={16}/>{t('Хаалттай бета · Бодит төлбөр идэвхгүй','Closed beta · No real payments')}</div></div>
   {columns.map(col=><nav key={col.en} aria-label={en?col.en:col.mn}><h3>{en?col.en:col.mn}</h3>{col.links.map(([href,mn,english])=><Link href={href} key={href+english}>{en?english:mn}</Link>)}</nav>)}
  </div>
  <div className="shell footer-bottom"><span>© 2026 Hustle.mn. {t('Бүх эрх хуулиар хамгаалагдсан.','All rights reserved.')}</span><span className="footer-bottom-note"><Compass size={15}/>{t('Монголд бүтээгдэж буй хаалттай туршилтын платформ','A beta marketplace built for Mongolia')}</span><nav aria-label="Legal links"><Link href="/privacy/">Privacy</Link><Link href="/terms/">Terms</Link><Link href="/cookies/">Cookies</Link></nav></div>
 </footer>;
}
