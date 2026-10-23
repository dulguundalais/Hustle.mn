export type PublicEnv={NEXT_PUBLIC_SUPABASE_URL?:string;NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?:string};
const esc=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
interface PublicSeller{display_name:string;headline:string;bio:string;slug:string;portfolio:{title:string;object_path:string}[];services:{id:string;title:string;title_en:string;description:string;price:number;delivery_days:number}[]}
export async function publicProfile(request:Request,slug:string,env:PublicEnv){
 const en=new URL(request.url).searchParams.get('lang')==='en',t=(mn:string,english:string)=>en?english:mn;
 if(!/^[a-z0-9][a-z0-9-]{2,59}$/.test(slug))return new Response('Profile not found',{status:404});
 if(!env.NEXT_PUBLIC_SUPABASE_URL||!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)return new Response('Profiles are not configured',{status:503});
 const result=await fetch(env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/rpc/public_seller',{method:'POST',headers:{apikey:env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({profile_slug:slug})});
 if(!result.ok)return new Response('Profile unavailable',{status:503});
 const p=await result.json() as PublicSeller|null;
 if(!p)return new Response('Profile not found or not shared publicly',{status:404,headers:{'Cache-Control':'no-store'}});
 const origin=new URL(request.url).origin,url=origin+'/p/'+encodeURIComponent(p.slug),title=p.display_name+' — Hustle.mn',description=p.headline||p.bio.slice(0,180),image=origin+'/og/hustle.png';
 const html=`<!doctype html><html lang="${en?'en':'mn'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(url)}"><meta property="og:type" content="profile"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(url)}"><meta property="og:site_name" content="Hustle.mn"><meta property="og:image" content="${esc(image)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${esc(image)}"><link rel="stylesheet" href="/public-profile.css"></head><body><header><a class="brand" href="/">hustle<span>✳</span><small>mn</small></a><nav><a href="?lang=${en?'mn':'en'}">${en?'МОН':'EN'}</a><a class="button" href="/login/?mode=buyer&amp;seller=${encodeURIComponent(p.slug)}">${t('Холбогдох','Connect')} ↗</a></nav></header><main><section class="profile-hero"><div class="eyebrow">INDEPENDENT CREATIVE · MONGOLIA</div><div class="avatar">${esc(p.display_name.slice(0,2).toUpperCase())}</div><h1>${esc(p.display_name)}</h1><h2>${esc(p.headline)}</h2><p>${esc(p.bio)}</p><a class="button" href="/login/?mode=buyer&amp;seller=${encodeURIComponent(p.slug)}">${t('Хамтран ажиллах','Let’s work together')} ↗</a><span class="beta">${t('Захиалгыг зөвхөн бета гишүүд илгээнэ.','Orders are available to approved beta members.')}</span></section><section><div class="eyebrow">01 / SELECTED WORK</div><h2>${t('Сонгосон бүтээлүүд','Selected work')}</h2><div class="portfolio">${p.portfolio.map(i=>`<figure><img loading="lazy" src="/api/portfolio-image?path=${encodeURIComponent(i.object_path)}" alt="${esc(i.title)}"><figcaption>${esc(i.title)}</figcaption></figure>`).join('')||`<p>${t('Бүтээл хараахан нэмээгүй.','No portfolio projects yet.')}</p>`}</div></section><section><div class="eyebrow">02 / WORK WITH ME</div><h2>${t('Үйлчилгээнүүд','Services')}</h2><div class="services">${p.services.map(s=>`<article><h3>${esc(en&&s.title_en?s.title_en:s.title)}</h3><p>${esc(s.description)}</p><footer><strong>${esc(new Intl.NumberFormat('mn-MN').format(s.price))} ₮</strong><span>${s.delivery_days} ${t('хоног','days')}</span><a href="/listing/?id=${encodeURIComponent(s.id)}">${t('Дэлгэрэнгүй','View service')} ↗</a></footer></article>`).join('')||`<p>${t('Нийтэлсэн үйлчилгээ хараахан алга.','No published services yet.')}</p>`}</div></section></main><footer class="site-footer"><a class="brand" href="/">hustle<span>✳</span><small>mn</small></a><p>${t('Монгол ур чадвар. Хязгааргүй боломж.','Local talent. Limitless possibilities.')}</p><span>© 2026</span></footer></body></html>`;
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});
}
// The portfolio bucket remains PRIVATE. Anon SELECT is available only for
// objects explicitly attached to opt-in public seller profiles (database RLS).
// Sign each permitted image for 60 seconds; never expose a service-role secret
// or turn the whole bucket public.
export async function portfolioImage(request:Request,env:PublicEnv){
 const path=new URL(request.url).searchParams.get('path')||'';
 const noStore={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 if(!/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(path))
  return new Response('Not found',{status:404,headers:noStore});
 const url=env.NEXT_PUBLIC_SUPABASE_URL, key=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return new Response('Unavailable',{status:503,headers:noStore});
 let origin:URL;
 try{origin=new URL(url)}catch{return new Response('Unavailable',{status:503,headers:noStore})}
 if(origin.protocol!=='https:')return new Response('Unavailable',{status:503,headers:noStore});
 const headers:Record<string,string>={apikey:key,'Content-Type':'application/json'};
 // Legacy anon keys are JWTs; newer sb_publishable keys are NOT JWTs and
 // must not be placed in the Authorization header.
 if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
 try{
  const signingUrl=origin.origin+'/storage/v1/object/sign/portfolio/'+path;
  const signBody=JSON.stringify({expiresIn:60});
  let signing=await fetch(signingUrl,{method:'POST',headers,body:signBody});
  // SDKs on some gateway generations send the publishable key as both
  // apikey and bearer. Retry only an authorization failure and only with
  // the same low-privilege public key; no service-role escalation.
  if((signing.status===401||signing.status===403)&&key.startsWith('sb_publishable_')){
   signing=await fetch(signingUrl,{method:'POST',headers:{...headers,Authorization:'Bearer '+key},body:signBody});
  }
  if(!signing.ok)return new Response('Image not found',{status:404,headers:{...noStore,'X-Hustle-Storage-Step':'sign','X-Hustle-Storage-Status':String(signing.status)}});
  const signed=await signing.json() as {signedURL?:string;signedUrl?:string};
  const candidate=signed.signedURL||signed.signedUrl||'';
  const signedUrl=new URL(candidate.startsWith('/object/')?'/storage/v1'+candidate:candidate,origin.origin);
  // Never follow user-controlled or compromised upstream cross-origin URLs.
  if(signedUrl.origin!==origin.origin||
     !signedUrl.pathname.startsWith('/storage/v1/object/sign/portfolio/'+path)||
     !signedUrl.searchParams.has('token'))
   return new Response('Image unavailable',{status:502,headers:noStore});
  // A 60-second signed URL is intended for the browser. Redirect directly
  // instead of re-fetching from a Worker (which can fail on Storage CDN
  // redirects). The URL was verified to belong to this Supabase project.
  // Content is still held in a private, RLS-protected Storage bucket.
  return new Response(null,{status:302,headers:{...noStore,Location:signedUrl.toString(),
   'Referrer-Policy':'no-referrer'}});

 }catch{return new Response('Image unavailable',{status:502,headers:noStore})}
}
