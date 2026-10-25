'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {marketplaceClient} from './client';

// V37: existing saved_services table already enforces user ownership and published services with RLS.
export const validServiceId = (id:string):boolean =>
 /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

export function useSavedServices(){
 const [saved,setSaved]=useState<string[]>([]);
 const [userId,setUserId]=useState<string|null>(null);
 const [status,setStatus]=useState<'checking'|'guest'|'loading'|'ready'|'error'>('checking');
 const [error,setError]=useState('');
 const [busy,setBusy]=useState<string[]>([]);
 const owner=useRef<string|null>(null);
 const pending=useRef(new Set<string>());
 useEffect(()=>{
  let active=true,sequence=0;
  const clear=()=>{owner.current=null;setUserId(null);setSaved([]);setBusy([]);pending.current.clear()};
  const refresh=async(user:{id:string}|null)=>{
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
    setSaved((result.data||[]).map(row=>row.service_id).filter((id:string)=>validServiceId(id)));
    setStatus('ready');
   }catch{
    if(active&&sequence===version){setSaved([]);setStatus('error');setError('Could not load your saved services. Please retry.')}
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
  }).catch(()=>{if(active){clear();setStatus('error');setError('Saved services are unavailable.')}});
  return()=>{active=false;sequence++;unsubscribe();clear()};
 },[]);
 const toggle=useCallback(async(serviceId:string):Promise<boolean>=>{
  const id=owner.current;
  if(!id||!validServiceId(serviceId)||pending.current.has(serviceId)||status!=='ready')return false;
  pending.current.add(serviceId);setBusy(current=>[...current,serviceId]);setError('');
  try{
   const db=await marketplaceClient();
   const {data:{user},error:authError}=await db.auth.getUser();
   if(authError||user?.id!==id||owner.current!==id)throw new Error('Session changed');
   const exists=saved.includes(serviceId);
   const result=exists
    ?await db.from('saved_services').delete().eq('user_id',id).eq('service_id',serviceId)
    :await db.from('saved_services').insert({user_id:id,service_id:serviceId});
   if(result.error)throw result.error;
   if(owner.current===id)setSaved(current=>exists?current.filter(x=>x!==serviceId):current.includes(serviceId)?current:[...current,serviceId]);
   return true;
  }catch{
   if(owner.current===id)setError('Could not update saved services. Please retry.');
   return false;
  }finally{
   pending.current.delete(serviceId);
   setBusy(current=>current.filter(x=>x!==serviceId));
  }
 },[saved,status]);
 return {saved,userId,status,error,busy,toggle};
}
