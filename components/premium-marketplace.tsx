"use client";
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {useSavedServices} from '../lib/marketplace/use-saved-services';
import {ArrowUpRight,ArrowRight,Search,Sun,Moon,Globe,Menu,X,Heart,PenTool,Clapperboard,Languages,Megaphone,Code2,Armchair,PanelsTopLeft,Sparkles,FileText,Check,Clock,Share2,ArrowLeft,Bot,BriefcaseBusiness,Calculator,Scale,BarChart3,Store,GraduationCap,HeartHandshake} from 'lucide-react';
import {CATEGORIES,categoryById,normalizeCategory} from '../lib/marketplace/taxonomy';
import type {User} from '@supabase/supabase-js';
import AccountMenu,{type AccountMenuIdentity} from './account-menu';
import GlobalNotifications from './global-notifications';
import {services, type Service} from '../lib/marketplace/catalog';
import {matchesService,suggestServices} from '../lib/marketplace/smart-search';
import {suggestLiveServices,type LiveService} from '../lib/marketplace/live-discovery';
import LiveCatalog from './live-catalog';
import {marketplaceClient} from '../lib/marketplace/client';
import {signInWithReturn} from '../lib/marketplace/ux-flows';
import {SignatureHero,SignatureStory} from './signature-home';
import BusinessSolutions from './business-solutions';
import {V19FeaturedIntro} from './v19-discovery';
import CategoryShowcase from './category-showcase';
import CategoryDirectory from './category-directory';
import PremiumFooter from './premium-footer';
import '../app/marketplace.css';
import '../app/account-menu.css';
import '../app/smart-search.css';
import '../app/unified-layout.css';
import '../app/v43-premium-editorial.css';
import '../app/v45-art-direction.css';
// V50: Explore chips follow the professional taxonomy.
const categoryIcons:Record<string,typeof PenTool>={ai:Bot,business:BriefcaseBusiness,marketing:Megaphone,tech:Code2,finance:Calculator,legal:Scale,research:BarChart3,creative:PenTool,commerce:Store,education:GraduationCap,wellbeing:HeartHandshake};
const categories=CATEGORIES.map(c=>[c.id,c.mn,c.en,categoryIcons[c.id]||Sparkles] as const);
const money=(n:number)=>new Intl.NumberFormat('mn-MN').format(n)+' ₮';
function Artwork({item}:{item:Service}){return <div aria-hidden="true" className={'art art-'+item.id}><span className="art-index">H / SELECTED CONCEPT</span>{item.id==='brand'?<><div className="brand-sheet"><span>n.</span><small>NOMAD STUDIO<br/>BRAND GUIDELINES / 2026</small></div><div className="brand-business"><b>nomad.</b><span>MOVE WITH PURPOSE.</span></div></>:item.id==='ui'?<><div className="mock-browser"><div className="browser-dots">● ● ●<span>form.studio</span></div><div className="mock-content"><small>SPACES FOR LIVING</small><b>Less, but<br/>better.</b><div className="room-arch"/><i>Explore collection ↗</i></div></div><div className="mock-phone"><span>form.</span><div/><small>A quieter<br/>kind of home.</small></div></>:item.id==='video'?<><div className="video-frame"><span>FRAME / 01</span><b>BEYOND<br/>THE FRAME.</b><div className="play-disc">▷</div><small>00:24 / 01:00</small></div><div className="video-timeline">{Array.from({length:13},(_,i)=><i key={i}/>)}</div></>:item.id==='web'?<div className="code-window"><div>● ● ● <span>hustle / next-project</span></div><p><em>const</em> nextIdea = {'{'}</p><p> name: <strong>"Your business"</strong>,</p><p> builtFor: <strong>"what’s next"</strong>,</p><p> possibilities: <strong>Infinity</strong></p><p>{'}'};</p><footer><span/>Ready to launch <ArrowUpRight size={14}/></footer></div>:item.id==='interior'?<><div className="room-wall"/><div className="room-sofa"/><div className="room-table"/><span className="art-label">A space<br/>to belong.</span></>:item.id==='ai'?<><div className="ai-sphere"/><span className="art-label">IMAGINE<br/>OTHERWISE.</span></>:item.id==='marketing'?<><div className="growth-bars">{[25,42,36,64,78].map((h,i)=><i key={i} style={{height:h+'%'}}/>)}</div><span className="art-label">MAKE<br/>YOUR MARK.</span></>:<><div className="document-sheet"><small>{item.id==='translation'?'WORDS THAT CONNECT':'THE NEXT CHAPTER'}</small><b>{item.id==='translation'?'Сайн үг.\nТом нөлөө.':'From idea\nto impact.'}</b><i/><i/><i/><i/></div></>}<span className="art-caption">{item.seller} / CONCEPT</span></div>}
export default function PremiumMarketplace({view='home',id}:{view?:'home'|'explore'|'service'|'seller'|'categories';id?:string}){
const favorites=useSavedServices();
const [sampleSaved,setSampleSaved]=useState<string[]>([]);
const [sessionState,setSessionState]=useState<'checking'|'signed-in'|'guest'>('checking');
const [account,setAccount]=useState<AccountMenuIdentity|null>(null);
const [signingOut,setSigningOut]=useState(false);
const [guestLoginHref,setGuestLoginHref]=useState('/login/?mode=buyer');
const [exploreListings,setExploreListings]=useState<LiveService[]>([]);
const [exploreOpen,setExploreOpen]=useState(false),[exploreActive,setExploreActive]=useState(-1);
const [exploreLoad,setExploreLoad]=useState<'loading'|'ready'|'error'>('loading');
const [en,setEn]=useState(false),[dark,setDark]=useState(false),[ready,setReady]=useState(false),[menu,setMenu]=useState(false),[query,setQuery]=useState(''),[cat,setCat]=useState('all'),[sub,setSub]=useState(''),[sort,setSort]=useState('featured'),[onlySaved,setOnlySaved]=useState(false),[notice,setNotice]=useState('');
const t=(mn:string,english:string)=>en?english:mn;
useEffect(()=>{try{setEn(localStorage.getItem('hustle-language')==='en');setDark(localStorage.getItem('hustle-theme')==='dark');const s=JSON.parse(localStorage.getItem('hustle-saved')||'[]');if(Array.isArray(s))setSampleSaved(s.filter(x=>typeof x==='string'&&!/^[0-9a-f-]{36}$/i.test(x)));}catch{}const p=new URLSearchParams(location.search);setQuery(p.get('q')||'');setCat(normalizeCategory(p.get('category')));setSub(p.get('sub')||'');setOnlySaved(p.get('saved')==='1');if(view!=='home')setGuestLoginHref(signInWithReturn(location.pathname+location.search));setReady(true)},[]);
useEffect(()=>{if(!ready)return;document.documentElement.lang=en?'en':'mn';try{localStorage.setItem('hustle-language',en?'en':'mn');localStorage.setItem('hustle-theme',dark?'dark':'light');localStorage.setItem('hustle-saved',JSON.stringify(sampleSaved))}catch{}},[en,dark,sampleSaved,ready]);
// Keep the public header in sync with persisted Supabase auth; never infer a session from local UI state.
useEffect(()=>{
 let active=true;let generation=0;let unsubscribe=()=>{};
 type Client=Awaited<ReturnType<typeof marketplaceClient>>;
 const showUser=async(db:Client,user:User|null,version:number)=>{
  if(!active||version!==generation)return;
  if(!user){setSessionState('guest');setAccount(null);return}
  const fallback=user.email?.split('@')[0]?.trim()||'Member';
  setSessionState('signed-in');
  setAccount({id:user.id,name:fallback,isSeller:false});
  try{
   // Profile is a presentation detail; auth persists even when this lookup is unavailable.
   const [result,beta]=await Promise.all([db.from('profiles').select('id,display_name,is_seller').eq('id',user.id).limit(1),Promise.resolve(db.from('beta_allowlist').select('role').eq('email',(user.email||'').toLowerCase()).eq('enabled',true).maybeSingle()).catch(()=>({data:null}))]);
   if(!active||version!==generation||result.error)return;
   const profile=result.data?.[0];
   setAccount(current=>current?.id===user.id?{
    id:user.id,name:profile?.display_name?.trim()||fallback,isSeller:profile?.is_seller===true,isAdmin:(beta.data as {role?:string}|null)?.role==='admin'
   }:current);
  }catch{/* Continue with the signed-in email-local-part fallback. */}
 };
 const verify=async()=>{
  const version=++generation;
  try{
   const db=await marketplaceClient();
   const {data:{user},error}=await db.auth.getUser();
   if(active&&version===generation)void showUser(db,error?null:user,version);
  }catch{if(active&&version===generation){setSessionState('guest');setAccount(null)}}
 };
 void marketplaceClient().then(db=>{
  if(!active)return;
  const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{
   const version=++generation;
   // Schedule profile reads outside the auth callback to avoid Supabase auth lock contention.
   void Promise.resolve().then(()=>showUser(db,session?.user||null,version));
  });
  unsubscribe=()=>subscription.unsubscribe();
  void verify();
 }).catch(()=>{if(active){setSessionState('guest');setAccount(null)}});
 const onFocus=()=>{void verify()};
 const onVisibility=()=>{if(document.visibilityState==='visible')void verify()};
 window.addEventListener('focus',onFocus);
 document.addEventListener('visibilitychange',onVisibility);
 return()=>{active=false;++generation;unsubscribe();window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',onVisibility)};
},[]);
async function signOutFromHome(){
 if(signingOut)return;
 setSigningOut(true);
 try{
  const db=await marketplaceClient();
  const {error}=await db.auth.signOut();
  if(error)throw error;
  setSessionState('guest');setAccount(null);setMenu(false);
  setNotice(t('Амжилттай гарлаа.','You have signed out.'));
 }catch{setNotice(t('Гарах үйлдэл амжилтгүй. Дахин оролдоно уу.','Could not sign out. Please try again.'))}
 finally{setSigningOut(false)}
}
useEffect(()=>{
 if(view!=='explore')return;
 let active=true;
 marketplaceClient().then(db=>db.rpc('marketplace_catalog')).then(r=>{
  if(!active)return;
  if(r.error)throw r.error;
  setExploreListings(Array.isArray(r.data)?r.data as LiveService[]:[]);
  setExploreLoad('ready');
 }).catch(()=>{if(active)setExploreLoad('error')});
 return()=>{active=false};
},[view]);
// Keep URLs shareable without a navigation/reset for each keystroke.
useEffect(()=>{
 if(!ready||view!=='explore')return;
 const timer=window.setTimeout(()=>{
  const u=new URL(window.location.href);
  if(query.trim())u.searchParams.set('q',query.trim());
  else u.searchParams.delete('q');
  if(cat!=='all')u.searchParams.set('category',cat);
  else u.searchParams.delete('category');
  if(cat!=='all'&&sub)u.searchParams.set('sub',sub);
  else u.searchParams.delete('sub');
  window.history.replaceState(window.history.state,'',u.pathname+u.search+u.hash);
 },250);
 return()=>clearTimeout(timer);
},[ready,view,query,cat,sub]);
const exploreSuggestions=useMemo(()=>suggestLiveServices(exploreListings,query,5),[exploreListings,query]);
const filtered=useMemo(()=>services.filter(s=>matchesService(s,query)),[query]);
const [heroQuery,setHeroQuery]=useState('');
const [suggestOpen,setSuggestOpen]=useState(false);
const suggestions=useMemo(()=>suggestServices(heroQuery,services,4),[heroQuery]);
const item=services.find(s=>s.id===id)||services[0];
const save=(key:string)=>{void favorites.toggle(key)};
const saveSample=(key:string)=>setSampleSaved(s=>s.includes(key)?s.filter(k=>k!==key):[...s,key]);
async function share(){try{await navigator.clipboard.writeText(location.href);setNotice(t('Холбоос хууллаа.','Link copied.'))}catch{setNotice(t('Хөтчийн хаягийн мөрөөс холбоосоо хуулна уу.','Copy the link from your browser address bar.'))}}
const card=(s:Service)=><article className="service-card-v5" key={s.id}><div className="card-art"><Link href={'/services/'+s.id} aria-label={en?s.en:s.mn}><Artwork item={s}/></Link><button className={'save '+(sampleSaved.includes(s.id)?'active':'')} aria-pressed={sampleSaved.includes(s.id)} aria-label={t('Үйлчилгээ хадгалах','Save service')} onClick={()=>saveSample(s.id)}><Heart size={17} fill={sampleSaved.includes(s.id)?'currentColor':'none'}/></button></div><div className="card-body"><div className="service-kicker">{categories.find(c=>c[0]===s.category)?.[en?2:1]}</div><Link className="seller-line" href={'/sellers/'+s.id}><span className={'avatar avatar-'+s.category}>{s.seller.split(' ').map(x=>x[0]).join('')}</span>{s.seller}<span className="sample-label">{t('Жишиг','Sample')}</span></Link><Link href={'/services/'+s.id}><h3>{en?s.en:s.mn}</h3></Link><div className="card-bottom"><span>{t('Эхлэх үнэ','From')} <strong>{money(s.price)}</strong></span><ArrowUpRight size={18}/></div></div></article>;
return <div className={'hustle-v5 '+(dark?'night':'')}><a className="skip-link" href="#main">{t('Үндсэн хэсэг рүү','Skip to content')}</a><header className="site-header"><div className="shell header-inner"><Link className="wordmark" href="/">hustle<span>✳</span><small>mn</small></Link><nav className={menu?'open':''} aria-label={t('Үндсэн цэс','Main navigation')}><Link href="/explore" onClick={()=>setMenu(false)}>{t('Үйлчилгээ хайх','Explore services')}</Link><Link href="/solutions/" onClick={()=>setMenu(false)}>{t('Шийдэл олох','Find a solution')}</Link><a href="/#how">{t('Хэрхэн ажилладаг вэ?','How it works')}</a>{sessionState!=='checking'&&<Link className="mobile-auth-nav" href={sessionState==='signed-in'?(account?.isSeller?'/seller-studio/':'/buyer/'):guestLoginHref} onClick={()=>setMenu(false)}>{sessionState==='signed-in'?t('Миний орон зай','My dashboard'):t('Нэвтрэх','Log in')}</Link>}</nav><div className="header-actions"><button className="icon-button locale" onClick={()=>setEn(!en)} aria-label={t('Англи хэл сонгох','Switch to Mongolian')}><Globe size={16}/>{en?'EN':'MN'}</button><button className="icon-button" onClick={()=>setDark(!dark)} aria-label={t('Өнгөний горим солих','Toggle color theme')}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button>{sessionState==='signed-in'&&account&&<GlobalNotifications key={account.id} userId={account.id} en={en} isSeller={account.isSeller}/>}{sessionState==='signed-in'&&account?<AccountMenu account={account} en={en} signingOut={signingOut} onSignOut={signOutFromHome}/>:sessionState==='guest'?<><Link href={guestLoginHref} className="login-link">{t('Нэвтрэх','Log in')}</Link><Link href="/join/seller/" className="button small">{t('Бүтээлчээр нэгдэх','Join as a creative')}<ArrowUpRight size={16}/></Link></>:<span className="account-nav-checking" role="status" aria-label={t('Нэвтрэлтийн төлөв шалгаж байна','Checking sign-in status')}/>}<button className="icon-button mobile-menu" aria-expanded={menu} aria-label={t('Цэс','Menu')} onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button></div></div></header><nav className={(view==='home'||view==='explore')?'market-category-nav v19-hide-category-nav':'market-category-nav'} aria-label={t('Ангилал үзэх','Browse categories')}><div className="shell">{categories.map(([key,mn,eng])=><Link key={key} href={'/explore/?category='+key}>{en?eng:mn}</Link>)}</div></nav><main id="main">
{view==='home'&&<SignatureHero en={en}/>}
{view==='home'&&<BusinessSolutions en={en}/>}
{view==='home'&&<CategoryShowcase en={en}/>}
{view==='categories'&&<CategoryDirectory en={en}/>}

{view==='explore'&&<section className="shell discovery"><div className="section-top"><div><div className="eyebrow muted">{t('ҮЙЛЧИЛГЭЭНИЙ СОНГОЛТ','EXPLORE THE MARKETPLACE')}</div><h2>{t('Зөв хүнээ эндээс ол.','Find your people.')}</h2><p>{t('Бодит үйлчилгээ, ил тод үнэ, уян хатан багц.','Real services. Clear prices. Flexible packages.')}</p></div></div><div className="categories" role="group" aria-label={t('Үйлчилгээний ангилал','Service categories')}><button className={cat==='all'?'selected':''} onClick={()=>{setCat('all');setSub('')}}><span className="category-symbol"><PanelsTopLeft size={23} strokeWidth={1.6}/></span><span>{t('Бүгд','All')}</span></button>{categories.map(([key,mn,english,Icon])=><button key={key} className={cat===key?'selected':''} aria-pressed={cat===key} onClick={()=>{setCat(key);setSub('')}}><span className="category-symbol"><Icon size={23} strokeWidth={1.6}/></span><span>{en?english:mn}</span></button>)}</div>{cat!=='all'&&categoryById(cat)&&<div className="v50-subchips" role="group" aria-label={t('Дэд ангилал','Subcategories')}><button type="button" aria-pressed={!sub} onClick={()=>setSub('')}>{t('Бүгд','All')}</button>{categoryById(cat)!.subcategories.map(x=><button type="button" key={x.id} aria-pressed={sub===x.id} onClick={()=>setSub(x.id)}>{en?x.en:x.mn}</button>)}</div>}<div className="filter-row"><div className="smart-explore-search" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setExploreOpen(false)}}>
 <label className="filter-search"><Search size={18}/><input value={query} onChange={e=>{setQuery(e.target.value);setExploreOpen(true);setExploreActive(-1)}} onFocus={()=>setExploreOpen(true)}
 onKeyDown={e=>{
  if(e.key==='Escape'){setExploreOpen(false);setExploreActive(-1)}
  else if(e.key==='ArrowDown'&&exploreSuggestions.length){e.preventDefault();setExploreOpen(true);setExploreActive(i=>(i+1)%exploreSuggestions.length)}
  else if(e.key==='ArrowUp'&&exploreSuggestions.length){e.preventDefault();setExploreOpen(true);setExploreActive(i=>i<0?exploreSuggestions.length-1:(i-1+exploreSuggestions.length)%exploreSuggestions.length)}
  else if(e.key==='Enter'&&exploreOpen&&exploreActive>=0&&exploreSuggestions[exploreActive]){e.preventDefault();window.location.assign('/listing/?id='+encodeURIComponent(exploreSuggestions[exploreActive].id))}
 }}
 role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={exploreOpen&&exploreLoad==='ready'} aria-controls="explore-search-suggestions" aria-activedescendant={exploreActive>=0&&exploreSuggestions[exploreActive]?'explore-search-option-'+exploreActive:undefined}
 placeholder={t('Үйлчилгээ, мэргэжилтэн хайх','Search services or creatives')} aria-label={t('Хайлтын үг','Search query')}/></label>
 {exploreOpen&&exploreLoad==='ready'&&<div className="smart-explore-suggestions" role="listbox" id="explore-search-suggestions" aria-label={t('Бодит үйлчилгээний санал','Published service suggestions')}>
  {query.trim()?
   <>{exploreSuggestions.map((s,i)=><Link key={s.id} id={'explore-search-option-'+i} role="option" aria-selected={i===exploreActive} className={i===exploreActive?'active':''} href={'/listing/?id='+encodeURIComponent(s.id)}><Search size={16}/><span>{en&&s.title_en?s.title_en:s.title}</span><small>{s.category}</small></Link>)}
   {!exploreSuggestions.length&&<p>{t('Одоогоор тохирох нийтлэгдсэн үйлчилгээ алга.','No published services match this search yet.')}</p>}</>:
   <div className="smart-explore-queries"><small>{t('Хайж үзэх','Try searching')}</small>{[['logo','Лого','Logo'],['website','Вэбсайт','Website'],['video','Видео','Video'],['translation','Орчуулга','Translation']].map(([value,mn,eng])=><button type="button" key={value} onClick={()=>{setQuery(value);setExploreActive(-1)}}>{en?eng:mn}</button>)}</div>}
 </div>}
 </div><button className={'saved-filter '+(onlySaved?'selected':'')} onClick={()=>setOnlySaved(!onlySaved)} aria-pressed={onlySaved}><Heart size={16}/>{t('Хадгалсан','Saved')} ({favorites.saved.length})</button><select aria-label={t('Эрэмбэлэх','Sort services')} value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">{t('Онцлох','Featured')}</option><option value="low">{t('Үнэ: багаас','Price: low to high')}</option><option value="high">{t('Үнэ: ихээс','Price: high to low')}</option></select></div></section>}
{(view==='home'||view==='explore')&&<LiveCatalog en={en} signedIn={sessionState==='signed-in'} homePreview={view==='home'} query={view==='explore'?query:''} category={view==='explore'?cat:'all'} subcategory={view==='explore'?sub:''} sort={sort as 'featured'|'low'|'high'} onlySaved={onlySaved} saved={favorites.saved} onSave={save} canSave={favorites.status==='ready'} saveBusy={favorites.busy} saveError={favorites.error} onSignInSave={()=>window.location.assign(signInWithReturn('/explore/'))}/>}
{(view==='service'||view==='seller')&&<section className="shell detail"><Link className="text-link back" href="/explore"><ArrowLeft size={16}/>{t('Үйлчилгээнүүд','All services')}</Link><div className="detail-grid"><div>{view==='seller'?<div className="profile-heading"><span className="avatar large">{item.seller.split(' ').map(x=>x[0]).join('')}</span><div><div className="eyebrow muted">INDEPENDENT CREATIVE · MONGOLIA</div><h1>{item.seller}</h1><p>{t('Санааг тань онцгой бүтээл болгоно.','Thoughtful work for ambitious ideas.')}</p></div></div>:<><div className="eyebrow muted">{t('ЖИШИГ ҮЙЛЧИЛГЭЭ · БОДИТ ЗАР БИШ','SAMPLE SERVICE · NOT A LIVE LISTING')}</div><h1>{en?item.en:item.mn}</h1><Link className="seller-line" href={'/sellers/'+item.id}><span className="avatar">{item.seller.split(' ').map(x=>x[0]).join('')}</span>{item.seller}<ArrowUpRight size={15}/></Link></>}<Artwork item={item}/><h2>{view==='seller'?t('Сонгосон бүтээлүүд','Selected work'):t('Үйлчилгээний тухай','About this service')}</h2><p className="detail-description">{t('Таны бизнесийн зорилго, өнгө төрхөд нийцсэн бүтээлч шийдэл. Төслийн чиглэл, гүйцэтгэл болон хүлээлгэн өгөх материалыг ажил эхлэхээс өмнө тохиролцоно. Энэ профайл, portfolio болон үнэ нь интерфэйсийг турших жишиг өгөгдөл юм.','A creative solution shaped around your goals and identity. Scope, deliverables and timing are agreed before work begins. This profile, portfolio and pricing are sample data for interface testing.')}</p>{view==='seller'&&<div className="service-grid profile-services">{services.filter(s=>s.id===item.id).map(card)}</div>}</div><aside className="detail-aside"><div className="eyebrow muted">{t('ХАМТДАА БҮТЭЭЕ','LET’S MAKE IT HAPPEN')}</div><h2>{view==='seller'?item.seller:t('Төслийн эхлэх үнэ','Starting from')}</h2><div className="detail-price">{money(item.price)}</div><ul><li><Check size={18}/>{t('Төслийн чиглэлээ тохиролцоно','Agree on the project scope')}</li><li><Clock size={18}/>{t('Хугацааг хамтдаа төлөвлөнө','Plan the timeline together')}</li><li><Check size={18}/>{t('Төлбөргүй нээлттэй бета','Open beta — no payments')}</li></ul><Link className="button" href="/explore/#real-listings-title">{t('Бодит заруудыг харах','Browse real listings')}<ArrowUpRight size={17}/></Link><button className="button outline" onClick={share}><Share2 size={17}/>{t('Холбоос хуваалцах','Share this page')}</button><p>{t('Энэ нь жишиг зар бөгөөд бодит freelancer-тэй холбогдох боломжгүй. Дээрх бодит заруудаас сонгоорой.','This is a sample, not a contactable freelancer. Choose a real published listing instead.')}</p></aside></div></section>}
{view==='home'&&<SignatureStory en={en}/>}
</main><PremiumFooter en={en}/>{notice&&<div className="toast" role="status">{notice}<button aria-label={t('Хаах','Dismiss')} onClick={()=>setNotice('')}><X size={16}/></button></div>}</div>
}
