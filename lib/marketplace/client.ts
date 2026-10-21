'use client';
import {createBrowserClient} from '@supabase/ssr';
import type {SupabaseClient} from '@supabase/supabase-js';
let instance:Promise<SupabaseClient>|undefined;
export function marketplaceClient(){
 if(!instance)instance=fetch('/api/config').then(async r=>{if(!r.ok)throw new Error('Бета орчин тохируулагдаагүй / Beta environment not configured');const c=await r.json();if(!c.url||!c.key)throw new Error('Missing public configuration');// Share cookie-backed PKCE sessions with Next.js route handlers and server components.
  // A plain supabase-js client stores auth in localStorage, so server routes see no session.
  return createBrowserClient(c.url,c.key)}).catch(e=>{instance=undefined;throw e});
 return instance;
}
