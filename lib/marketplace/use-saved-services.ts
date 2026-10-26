'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {marketplaceClient} from './client';
import {ensureBuyerProfile} from './buyer-profile';

// V37: existing saved_services table already enforces user ownership and published services with RLS.
export const validServiceId = (id:string):boolean =>
 /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

// V52: a guest who presses the heart is asked to sign in; the service they wanted is
// remembered in this browser for a short time and saved once their list has loaded.
export const PENDING_SAVE_KEY='hustle-pending-save';
const PENDING_TTL=24*60*60*1000;
export function rememberPendingSave(serviceId:string,now=Date.now()):void{
 if(!validServiceId(serviceId))return;
 try{localStorage.setItem(PENDING_SAVE_KEY,JSON.stringify({id:serviceId,at:now}))}catch{}
}
export function readPendingSave(raw:string|null,now=Date.now()):string|null{
 if(!raw)return null;
 try{const v=JSON.parse(raw) as {id?:unknown;at?:unknown};return typeof v.id==='string'&&validServiceId(v.id)&&typeof v.at==='number'&&now-v.at<=PENDING_TTL&&v.at<=now+60000?v.id:null}catch{return null}
}
export type SavedStatus='checking'|'guest'|'loading'|'ready'|'error';
/** '' or a stable code the page translates: load | update | unavailable. */
export type SavedError=''|'load'|'update'|'unavailable';

export function useSavedServices(){
 const [saved,setSaved]=useState<string[]>([]);
 const [userId,setUserId]=useState<string|null>(null);
 const [status,setStatus]=useState<SavedStatus>('checking');
 const [error,setError]=useState<SavedError>('');
 const [busy,setBusy]=useState<string[]>([]);
 const [justSaved,setJustSaved]=useState<{id:string;at:number}|null>(null);
 const [reloadKey,setReloadKey]=useState(0);
 const owner=useRef<string|null>(null);
 const pending=useRef(new Set<string>());
 useEffect(()=>{
  let active=true,sequence=0;
  const clear=()=>{owner.current=null;setUserId(null);setSaved([]);setBusy([]);pending.current.clear()};
  const refresh=async(user:{id:string;email?:string|null}|null)=>{
   const version=++sequence;
   if(!active)return;
   if(!user){clear();setStatus('guest');setError('');return}
   if(owner.current!==user.id){setSaved([]);owner.current=user.id}
   setUserId(user.id);setStatus('loading');setError('');
   try{
    const db=await marketplaceClient();
    const result=await db.from('saved_services').select('service_id').eq('user_id',user.id).order('created_at',{ascending:false});
    if(!active||sequence!==version||owner.current!==user.id)return;
    if(result.error)throw result.error;
    let list=((result.data||[]) as {service_id:string}[]).map(row=>row.service_id).filter((id:string)=>validServiceId(id));
    // Complete a save the visitor started before signing in, once, without duplicates.
    let wanted:string|null=null;
    try{wanted=readPendingSave(localStorage.getItem(PENDING_SAVE_KEY));localStorage.removeItem(PENDING_SAVE_KEY)}catch{}
    if(wanted&&!list.includes(wanted)){
     await ensureBuyerProfile(db,user);
     const add=await db.from('saved_services').insert({user_id:user.id,service_id:wanted});
     if(!add.error||(add.error as {code?:string}).code==='23505'){list=[wanted,...list];setJustSaved({id:wanted,at:Date.now()})}
    }else if(wanted)setJustSaved({id:wanted,at:Date.now()});
    if(!active||sequence!==version||owner.current!==user.id)return;
    setSaved(list);
    setStatus('ready');
   }catch{
    if(active&&sequence===version){setSaved([]);setStatus('error');setError('load')}
   }
  };
  let unsubscribe=()=>{};
  void marketplaceClient().then(db=>{
   if(!active)return;
   const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{
    // Avoid database calls inside Supabase auth callback.
    void Promise.resolve().then(()=>refresh(session?.user||null));
   });
   unsubscribe=()=>subscription.unsubscribe();
   void db.auth.getUser().then(({data:{user},error})=>refresh(error?null:user)).catch(()=>refresh(null));
  }).catch(()=>{if(active){clear();setStatus('error');setError('unavailable')}});
  return()=>{active=false;sequence++;unsubscribe();clear()};
 },[reloadKey]);
 const toggle=useCallback(async(serviceId:string):Promise<boolean>=>{
  const id=owner.current;
  if(!id||!validServiceId(serviceId)||pending.current.has(serviceId)||status!=='ready')return false;
  pending.current.add(serviceId);setBusy(current=>[...current,serviceId]);setError('');
  try{
   const db=await marketplaceClient();
   const {data:{user},error:authError}=await db.auth.getUser();
   if(authError||!user||user.id!==id||owner.current!==id)throw new Error('Session changed');
   const exists=saved.includes(serviceId);
   if(!exists)await ensureBuyerProfile(db,user);
   const result=exists
    ?await db.from('saved_services').delete().eq('user_id',id).eq('service_id',serviceId)
    :await db.from('saved_services').insert({user_id:id,service_id:serviceId});
   if(result.error&&!(!exists&&(result.error as {code?:string}).code==='23505'))throw result.error;
   if(owner.current===id){
    setSaved(current=>exists?current.filter(x=>x!==serviceId):current.includes(serviceId)?current:[...current,serviceId]);
    if(!exists)setJustSaved({id:serviceId,at:Date.now()});
   }
   return true;
  }catch{
   if(owner.current===id)setError('update');
   return false;
  }finally{
   pending.current.delete(serviceId);
   setBusy(current=>current.filter(x=>x!==serviceId));
  }
 },[saved,status]);
 const reload=useCallback(()=>setReloadKey(k=>k+1),[]);
 return {saved,userId,status,error,busy,toggle,reload,justSaved};
}
