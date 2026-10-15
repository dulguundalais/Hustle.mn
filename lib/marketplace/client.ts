'use client';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
let instance:Promise<SupabaseClient>|undefined;
export function marketplaceClient(){
 if(!instance)instance=fetch('/api/config').then(async r=>{if(!r.ok)throw new Error('Бета орчин тохируулагдаагүй / Beta environment not configured');const c=await r.json();if(!c.url||!c.key)throw new Error('Missing public configuration');return createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})}).catch(e=>{instance=undefined;throw e});
 return instance;
}
