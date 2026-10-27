// V52 — the official support channel is configured by the owner, never hard-coded.
// Set HUSTLE_SUPPORT_EMAIL and/or HUSTLE_SUPPORT_URL in the Cloudflare Pages
// environment; /api/config passes the validated values to the browser. Until they
// are set the site shows self-service help and says plainly that no mailbox is listed.
export type SupportChannel={email:string|null;url:string|null};
export function parseSupportChannel(env:{HUSTLE_SUPPORT_EMAIL?:string;HUSTLE_SUPPORT_URL?:string}):SupportChannel{
 const rawEmail=String(env.HUSTLE_SUPPORT_EMAIL||'').trim().toLowerCase();
 const email=rawEmail.length<=120&&/^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(rawEmail)?rawEmail:null;
 let url:string|null=null;
 try{const u=new URL(String(env.HUSTLE_SUPPORT_URL||'').trim());if(u.protocol==='https:'&&!u.username&&!u.password)url=u.toString()}catch{}
 return {email,url};
}
