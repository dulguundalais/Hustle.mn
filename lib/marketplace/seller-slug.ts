// The public seller URL slug must agree with public.profiles_slug_check.
// Normalize user-entered Cyrillic/Latin names without ever widening DB constraints.
const cyrillic: Record<string,string> = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'j',з:'z',
  и:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',ө:'o',п:'p',
  р:'r',с:'s',т:'t',у:'u',ү:'u',ф:'f',х:'kh',ц:'ts',
  ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'
};
const pattern=/^[a-z0-9][a-z0-9-]{2,59}$/;

export function normalizeSellerSlug(value:string):string {
  return Array.from(value.trim().toLowerCase()).map(char=>cyrillic[char]??char).join('')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/-+/g,'-')
    .replace(/^-+|-+$/g,'');
}

export function isValidSellerSlug(slug:string):boolean {
  return pattern.test(slug);
}
