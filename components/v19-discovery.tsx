'use client';
import Link from 'next/link';
import {ArrowUpRight,PenTool,Clapperboard,Languages,Megaphone,Code2,Armchair,PanelsTopLeft,Sparkles,FileText,Layers3} from 'lucide-react';
import '../app/v19-home.css';
const options=[['design','Брэнд & Дизайн','Brand & Design',PenTool,'identity'],['video','Видео & Motion','Video & Motion',Clapperboard,'motion'],['web','Вэб & IT','Web & IT',Code2,'technology'],['ui','UI / UX','UI / UX',PanelsTopLeft,'experience'],['marketing','Маркетинг','Marketing',Megaphone,'growth'],['translation','Орчуулга & Контент','Translation & Content',Languages,'language'],['interior','Интерьер','Interior',Armchair,'space'],['ai','AI бүтээл','AI Creative',Sparkles,'future'],['proposals','Төсөл бичих','Business Proposals',FileText,'strategy']] as const;
export function PopularCategories({en}:{en:boolean}){
const t=(mn:string,eng:string)=>en?eng:mn;
return <section className="v19-section v19-categories shell" id="popular-categories" aria-labelledby="v19-category-title">
 <div className="v19-heading"><div><span className="v19-eyebrow">{t('01 / Ангиллаар хайх','01 / EXPLORE BY CATEGORY')}</span><h2 id="v19-category-title">{t('Ур чадвараар хай.','Explore by skill.')}</h2></div><Link className="v19-view-all" href="/explore/">{t('Бүх үйлчилгээг үзэх','Explore all services')}<ArrowUpRight size={18}/></Link></div>
 <div className="v19-category-grid">{options.map(([key,mn,eng,Icon,kind],i)=><Link href={'/explore/?category='+key} key={key} className={'v19-category-card v19-cat-'+kind}><span className="v19-category-number">{String(i+1).padStart(2,'0')}</span><div className="v19-category-icon"><Icon size={28} strokeWidth={1.65}/></div><span className="v19-category-title">{en?eng:mn}</span><span className="v19-category-arrow"><ArrowUpRight size={19}/></span></Link>)}</div>
</section>;
}
export function V19FeaturedIntro({en}:{en:boolean}){const t=(mn:string,eng:string)=>en?eng:mn;return <div className="v19-featured-intro shell"><span className="v19-eyebrow">{t('02 / Үйлчилгээ','02 / THE MARKETPLACE')}</span><h2>{t('Дараагийн төслөө эндээс эхлүүл.','Great work starts with the right match.')}</h2><p>{t('Бодит нийтлэгдсэн үйлчилгээ, ил тод үнэ, заавал биш багцуудаас өөрт тохирохыг олоорой.','Explore real published services with transparent starting prices and packages.')}</p></div>}
