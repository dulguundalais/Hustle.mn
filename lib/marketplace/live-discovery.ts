import {normalizeSearch} from './smart-search';

// Only published, opt-in marketplace_catalog RPC records are accepted here.
// Never mix editorial sample services into the buyer discovery index.
export type LiveService = {
 id:string;title:string;title_en:string;description:string;category:string;
 price:number;delivery_days:number;revisions:number;package_name:string;
 display_name:string;headline:string;slug:string;
 packages?:{tier:string;price:number;delivery_days:number;revisions:number;summary?:string;includes:string[]}[];
 review_count?:number;average_rating?:number|null;completed_orders?:number;
};
export type LiveSort = 'featured'|'low'|'high';
export type LiveFilters = {
 query:string;category:string;sort:LiveSort;onlySaved:boolean;saved:string[];
};

const aliases:Record<string,string[]> = {
 design:['logo','лого','brend','брэнд','branding','brand','graphic design','график дизайн','dizain','дизайн'],
 ui:['ui','ux','ui ux','ui/ux','интерфейс','interface','app design','апп дизайн'],
 video:['video','видео','reels','рилс','монтаж','montaj','editing','evluuleg','эвлүүлэг'],
 translation:['translation','orchuulga','орчуулга','translate','english','англи','copywriting'],
 marketing:['marketing','маркетинг','smm','реклам','reklam','social media','сошиал'],
 web:['web','website','вэб','веб','сайт','sait','veb','developer','код','code'],
 interior:['interior','интерьер','3d','дотоод засал'],
 ai:['ai','хиймэл оюун','prompt','промпт','ai зураг'],
 proposals:['business plan','бизнес төлөвлөгөө','төсөл','tosol','төслийн санал','proposal','тендер']
};
const stopWords=new Set(['hiih','hiilgeh','heregtei','kheregtei','need','want','the','for','and','a','an','to','uilchilgee','service','авмаар','авах']);
const words=(value:string)=>normalizeSearch(value).split(' ').filter(term=>term&&!stopWords.has(term));
const categoryWords=(category:string)=>[category,...(aliases[category]||[])].map(normalizeSearch);
function matching(service:LiveService,query:string):boolean {
 const terms=words(query);
 if(!terms.length)return true;
 const content=words([service.title,service.title_en,service.description,service.category,service.display_name,service.headline,
   ...(service.packages||[]).flatMap(p=>[p.summary||'',...(p.includes||[])])].join(' '));
 const categoryTokens=categoryWords(service.category).flatMap(words);
 return terms.every(term=>[...content,...categoryTokens].some(word=>word===term||word.startsWith(term)));
}
export function liveServicePrice(service:LiveService):number {
 const prices=(service.packages||[]).map(p=>Number(p.price)).filter(p=>Number.isFinite(p)&&p>0);
 const base=Number(service.price);
 return prices.length?Math.min(...prices):Number.isFinite(base)&&base>0?base:0;
}
export function filterLiveServices<T extends LiveService>(items:T[],filters:LiveFilters):T[] {
 const matched=items.filter(s=>(filters.category==='all'||s.category===filters.category)
   &&(!filters.onlySaved||filters.saved.includes(s.id))&&matching(s,filters.query));
 if(filters.sort==='featured')return matched; // Preserve backend ordering.
 return matched.sort((a,b)=>filters.sort==='low'
   ?liveServicePrice(a)-liveServicePrice(b):liveServicePrice(b)-liveServicePrice(a));
}
export function suggestLiveServices<T extends LiveService>(items:T[],query:string,limit=4):T[] {
 if(!words(query).length)return [];
 const matched=filterLiveServices(items,{query,category:'all',sort:'featured',onlySaved:false,saved:[]});
 const normalized=normalizeSearch(query);
 return matched.sort((a,b)=>{
   const weight=(s:LiveService)=>{
     const name=normalizeSearch(s.title+' '+s.title_en);
     return name.startsWith(normalized)?2:name.includes(normalized)?1:0;
   };
   return weight(b)-weight(a);
 }).slice(0,Math.max(0,limit));
}
