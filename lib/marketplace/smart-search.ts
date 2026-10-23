import type {Service} from './catalog';

// No paid AI service required: a deterministic, privacy-friendly first stage.
// All matches are against explicitly marked sample listing data.
const cyrillic: Record<string,string> = {
  а:'a', б:'b', в:'v', г:'g', д:'d', е:'e', ё:'yo', ж:'j', з:'z',
  и:'i', й:'i', к:'k', л:'l', м:'m', н:'n', о:'o', ө:'o',
  п:'p', р:'r', с:'s', т:'t', у:'u', ү:'u', ф:'f', х:'kh',
  ц:'ts', ч:'ch', ш:'sh', щ:'sh', ъ:'', ы:'i', ь:'', э:'e', ю:'yu', я:'ya'
};
const aliases: Record<string,string[]> = {
  brand: ['logo', 'logo hiih', 'лого', 'брэнд', 'brend', 'brand identity', 'graphic design', 'график дизайн', 'dizain', 'design', 'таних тэмдэг'],
  video: ['video', 'видео', 'видео эвлүүлэг', 'video evluuleg', 'reels', 'ريلс', 'рилс', 'tiktok', 'montaj', 'монтаж', 'сошиал бичлэг', 'soshial bichleg'],
  ui: ['ui', 'ux', 'ui ux', 'дизайн', 'dizain', 'website design', 'app design', 'апп дизайн', 'аппликейшн', 'interface', 'интерфейс'],
  interior: ['interior', 'интерьер', 'дотоод засал', 'dotood zasal', '3d', 'орон сууцны дизайн'],
  web: ['web', 'website', 'veb', 'вэб', 'веб', 'сайт', 'sait', 'site', 'website hiih', 'program', 'програм', 'code', 'код', 'developer', 'хөгжүүлэлт'],
  marketing: ['marketing', 'маркетинг', 'markеting', 'digital marketing', 'smm', 'сошиал', 'social media', 'reklam', 'реклам', 'зар сурталчилгаа', 'content', 'контент'],
  ai: ['ai', 'хиймэл оюун', 'artificial intelligence', 'ai зураг', 'ai video', 'midjourney', 'prompt', 'промпт', 'зураг бүтээх'],
  translation: ['translation', 'орчуулга', 'orchuulga', 'translate', 'хэл', 'hel', 'english', 'англи', 'copywriting', 'текст', 'контент бичих'],
  proposals: ['төсөл', 'tosol', 'төслийн санал', 'business plan', 'бизнес төлөвлөгөө', 'бизнес план', 'proposal', 'tender', 'тендер', 'pitch deck']
};
const stopWords = new Set(['hiih','hiilgekh','hiilgeh','khiilgeh','khiilgekh','heregtei','kheregtei','need','want','to','a','an','the','for','and','service','uilchilgee','avmaar','avakh','авах','авмаар','minii','nadad','nad','please']);

// Normalize mixed Cyrillic, romanized Mongolian, and English on either side.
export function normalizeSearch(value:string):string {
  return value.normalize('NFKC').toLowerCase()
    .replace(/ё/g,'е')
    .replace(/[а-яөүёъь]/g,ch=>cyrillic[ch] ?? ch)
    .replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
export const searchTokens=(value:string)=>normalizeSearch(value).split(' ').filter(w=>w && !stopWords.has(w));
const tokenize=searchTokens;

export function typoClose(a:string,b:string) {
  if(a.length<4 || b.length<4 || Math.abs(a.length-b.length)>1)return false;
  if(a===b)return true;
  // One adjacent swapped letter counts as a single typo (e.g. websiet -> website).
  if(a.length===b.length){
    const mismatch=[...a].map((c,i)=>c===b[i]?-1:i).filter(i=>i>=0);
    if(mismatch.length===2&&mismatch[1]===mismatch[0]+1&&a[mismatch[0]]===b[mismatch[1]]&&a[mismatch[1]]===b[mismatch[0]])return true;
  }
  // Single edit only, including an inserted/deleted letter; avoids broad fuzzy matches.
  let i=0,j=0,edits=0;
  while(i<a.length && j<b.length) {
    if(a[i]===b[j]){i++;j++;continue;}
    if(++edits>1)return false;
    if(a.length>b.length)i++;
    else if(b.length>a.length)j++;
    else {i++;j++;}
  }
  return edits+(a.length-i)+(b.length-j)<=1;
}

export function matchesService(service:Service,query:string):boolean {
  const terms=tokenize(query);
  if(!terms.length)return true;
  const text=[service.mn,service.en,service.seller,...(aliases[service.id]||[])];
  const words=new Set(text.flatMap(tokenize));
  return terms.every(term => [...words].some(word =>
    word===term || word.startsWith(term) || (term.length>=4 && typoClose(term,word))
  ));
}

export function suggestServices(query:string,items:Service[],limit=4):Service[] {
  if(!tokenize(query).length)return [];
  return items.filter(item=>matchesService(item,query)).slice(0,limit);
}
