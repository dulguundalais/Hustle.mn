// V35.2 — Never trust a client-provided post-login destination without validating it.
// Only known Hustle local routes are accepted; no cross-origin, protocol-relative or
// authentication/recovery endpoints are eligible for a return redirect.
const safeRoutes=new Set([
 '/','/explore/','/solutions/','/project-requests/','/seller-requests/',
 '/buyer/','/seller-studio/','/listing/'
]);
export function safePostLoginPath(input:string|null|undefined):string|null{
 if(!input||input.length>2000||!input.startsWith('/')||input.startsWith('//')||/[\\\u0000-\u001f\u007f]/.test(input))return null;
 try{
  const url=new URL(input,'https://hustle.invalid');
  const normalized=url.pathname.endsWith('/')?url.pathname:url.pathname+'/';
  if(url.origin!=='https://hustle.invalid'||!safeRoutes.has(normalized))return null;
  return normalized+url.search;
 }catch{return null}
}
export function signInWithReturn(path:string,mode:'buyer'|'seller'='buyer'){
 const url=new URLSearchParams({mode});
 const safe=safePostLoginPath(path);
 if(safe)url.set('next',safe);
 return '/login/?'+url.toString();
}
// Client-only, per-identity local draft keys. Keys must not contain e-mail or passwords.
export function projectDraftKey(userId:string){
 return 'hustle:v35.3:project:'+userId;
}
export function proposalDraftKey(userId:string,invitationId:string){
 return 'hustle:v35.3:proposal:'+userId+':'+invitationId;
}
