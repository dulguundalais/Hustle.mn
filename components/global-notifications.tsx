'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {Bell,BellOff,Check,ChevronRight,MessageCircle,PackageCheck,RefreshCw,FileText} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import {badgeCount,combineNotices,type ProjectEvent,type OrderEvent,type ChatEvent,type UnifiedNotice} from '../lib/marketplace/notification-center';
import '../app/global-notifications.css';

export default function GlobalNotifications({userId,en,isSeller=false}:{userId:string;en:boolean;isSeller?:boolean}){
 const [open,setOpen]=useState(false);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [refreshing,setRefreshing]=useState(false);
 const [error,setError]=useState('');
 const [inbox,setInbox]=useState<ReturnType<typeof combineNotices>>({items:[],unread:0,chatUnread:0,projectUnread:0,orderUnread:0});
 const root=useRef<HTMLDivElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 const generation=useRef(0);
 const t=(mn:string,english:string)=>en?english:mn;
 const refresh=useCallback(async()=>{
  if(!userId)return;
  const version=++generation.current;
  setRefreshing(true);
  try{
   const db=await marketplaceClient();
   // No service keys or privileged RPC. RLS applies on all three existing tables.
   const [project,order,chats]=await Promise.all([
    db.from('project_notifications').select('id,recipient_id,request_id,kind,created_at,read_at').eq('recipient_id',userId).order('created_at',{ascending:false}).limit(75),
    db.from('order_notifications').select('id,recipient_id,order_id,kind,created_at,read_at').eq('recipient_id',userId).order('created_at',{ascending:false}).limit(75),
    db.from('messages').select('id,sender_id,recipient_id,created_at,read_at').eq('recipient_id',userId).is('read_at',null).order('created_at',{ascending:false}).limit(100)
   ]);
   if(version!==generation.current)return;
   // Pending migrations must never crash homepage, but surface a useful warning.
   const issues=[project.error,order.error,chats.error].filter(Boolean);
   setError(issues.length?t('Зарим мэдэгдлийг ачаалж чадсангүй. Дахин оролдоно уу.','Some notifications could not be loaded. Retry shortly.'):'');
   setInbox(combineNotices(
    (project.error?[]:project.data||[]) as ProjectEvent[],
    (order.error?[]:order.data||[]) as OrderEvent[],
    (chats.error?[]:chats.data||[]) as ChatEvent[]
   ));
  }catch{
   if(version===generation.current)setError(t('Мэдэгдлүүдийг шинэчилж чадсангүй.','Could not refresh notifications.'));
  }finally{if(version===generation.current){setLoading(false);setRefreshing(false)}}
 },[userId,en]);
 useEffect(()=>{
  setInbox({items:[],unread:0,chatUnread:0,projectUnread:0,orderUnread:0});
  setLoading(true);setRefreshing(false);setError('');setOpen(false);
  void refresh();
  const onFocus=()=>void refresh();
  const onVisible=()=>{if(document.visibilityState==='visible')void refresh()};
  const tick=window.setInterval(()=>{if(document.visibilityState==='visible')void refresh()},45000);
  window.addEventListener('focus',onFocus);document.addEventListener('visibilitychange',onVisible);
  return()=>{
   generation.current++;
   clearInterval(tick);
   window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',onVisible);
  };
 },[userId,refresh]);
 // Realtime is opportunistic: 45s polling, focus and visibility refresh remain the fallback.
 // Subscribe only to recipient-scoped changes and remove the channel on cleanup.
 useEffect(()=>{
  if(!userId)return;
  let active=true;
  let unsubscribe=()=>{};
  let debounce:ReturnType<typeof setTimeout>|null=null;
  const queueRefresh=()=>{
   if(!active)return;
   if(debounce!==null)clearTimeout(debounce);
   debounce=setTimeout(()=>{debounce=null;if(active)void refresh()},250);
  };
  void marketplaceClient().then(db=>{
   if(!active)return;
   const channel=db.channel('v44-notices-'+userId)
    .on('postgres_changes',{event:'*',schema:'public',table:'project_notifications',filter:'recipient_id=eq.'+userId},queueRefresh)
    .on('postgres_changes',{event:'*',schema:'public',table:'order_notifications',filter:'recipient_id=eq.'+userId},queueRefresh)
    .on('postgres_changes',{event:'*',schema:'public',table:'messages',filter:'recipient_id=eq.'+userId},queueRefresh)
    .subscribe();
   unsubscribe=()=>{void db.removeChannel(channel)};
  }).catch(()=>{/* Polling remains active when Realtime is unavailable. */});
  return()=>{active=false;if(debounce!==null)clearTimeout(debounce);unsubscribe()};
 },[userId,refresh]);
 const chatHref=isSeller?'/seller-studio/?tab=messages':'/buyer/?tab=messages';
 useEffect(()=>{
  if(!open)return;
  const outside=(e:PointerEvent)=>{if(root.current&&!root.current.contains(e.target as Node))setOpen(false)};
  const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus()}};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)};
 },[open]);
 const markRead=async(item:UnifiedNotice)=>{
  if(item.source==='chat'||item.read||busy)return;
  setBusy(true);setError('');
  try{
   const db=await marketplaceClient();
   const table=item.source==='project'?'project_notifications':'order_notifications';
   const result=await db.from(table).update({read_at:new Date().toISOString()}).eq('id',item.id).eq('recipient_id',userId).is('read_at',null);
   if(result.error)throw result.error;
   setInbox(previous=>{
    const items=previous.items.map(n=>n.key===item.key?{...n,read:true}:n);
    return {...previous,items,unread:Math.max(0,previous.unread-1),
     projectUnread:Math.max(0,previous.projectUnread-(item.source==='project'?1:0)),
     orderUnread:Math.max(0,previous.orderUnread-(item.source==='order'?1:0))};
   });
  }catch{setError(t('Уншсан төлөвийг хадгалж чадсангүй.','Could not mark this notification read.'))}
  finally{setBusy(false)}
 };
 const markAll=async()=>{
  if(busy)return;
  setBusy(true);setError('');
  try{
   const db=await marketplaceClient();
   const now=new Date().toISOString();
   const results=await Promise.all([
    db.from('project_notifications').update({read_at:now}).eq('recipient_id',userId).is('read_at',null),
    db.from('order_notifications').update({read_at:now}).eq('recipient_id',userId).is('read_at',null)
   ]);
   if(results.some(r=>r.error))throw new Error('Mark read failed');
   setInbox(previous=>({...previous,items:previous.items.map(item=>item.source==='chat'?item:{...item,read:true}),
    unread:previous.chatUnread,projectUnread:0,orderUnread:0}));
  }catch{setError(t('Мэдэгдлүүдийг уншсан болгож чадсангүй.','Could not mark notifications read.'))}
  finally{setBusy(false)}
 };
 const unread=inbox.unread;
 return <div className="global-notifications" ref={root}>
  <button type="button" className={'global-notice-trigger'+(open?' expanded':'')} ref={trigger}
   aria-label={t('Мэдэгдэл','Notifications')+(unread?' ('+unread+')':'')}
   aria-controls="global-notice-panel" aria-expanded={open} aria-haspopup="true"
   onClick={()=>{setOpen(v=>!v);if(!open)void refresh()}}>
   <Bell size={19} aria-hidden="true"/>
   {unread>0&&<span className="global-notice-count" aria-hidden="true">{badgeCount(unread)}</span>}
  </button>
  {open&&<div id="global-notice-panel" className="global-notice-panel" role="region" aria-label={t('Мэдэгдлийн төв','Notification center')}>
   <div className="global-notice-heading"><strong>{t('Мэдэгдлүүд','Notifications')}</strong><button disabled={refreshing||busy} type="button" aria-label={t('Шинэчлэх','Refresh notifications')} onClick={()=>void refresh()}><RefreshCw size={16} className={refreshing?'global-notice-refreshing':undefined}/></button></div>
   <div className="global-notice-summary">
    <span aria-live="polite">{t('Уншаагүй','Unread')}: <b>{badgeCount(unread)}</b></span>
    {(inbox.projectUnread+inbox.orderUnread)>0&&<button type="button" disabled={busy} onClick={()=>void markAll()}>{t('Бүгдийг уншсан болгох','Mark alerts read')}</button>}
   </div>
   {error&&<p className="global-notice-error" role="alert">{error}</p>}
   {loading?<p className="global-notice-empty">{t('Шалгаж байна…','Checking notifications…')}</p>:
    inbox.items.length===0?<div className="global-notice-empty"><BellOff size={22}/><p>{t('Одоогоор мэдэгдэл алга.','No notifications yet.')}</p></div>:
    <div className="global-notice-list">{inbox.items.map(item=><div className={'global-notice-item'+(!item.read?' unread':'')} key={item.key}>
     <div className="global-notice-symbol">{item.source==='chat'?<MessageCircle size={17}/>:item.source==='order'?<PackageCheck size={17}/>:<FileText size={17}/>}</div>
     <div className="global-notice-info">
      <Link href={item.source==='chat'?chatHref:item.href} onClick={()=>{setOpen(false);if(item.source!=='chat')void markRead(item)}}>{en?item.titleEn:item.titleMn}{item.count>1?' ('+item.count+')':''}<ChevronRight size={13}/></Link>
      <small>{new Date(item.createdAt).toLocaleDateString(en?'en-US':'mn-MN')}</small>
     </div>
     {!item.read&&item.source!=='chat'&&<button className="global-notice-read" type="button" disabled={busy} onClick={()=>void markRead(item)} aria-label={t('Уншсан болгох','Mark read')}><Check size={15}/></button>}
    </div>)}</div>}
   {inbox.chatUnread>0&&<p className="global-notice-hint">{t('Чатыг нээхэд зурвас уншсанд тооцогдоно.','Chat messages are marked read when you open the conversation.')}</p>}
   <div className="global-notice-footer"><Link href={chatHref} onClick={()=>setOpen(false)}><MessageCircle size={15}/>{t('Мессежүүд','Messages')}</Link><Link href="/project-requests/" onClick={()=>setOpen(false)}>{t('Төслүүд','Projects')}<ChevronRight size={15}/></Link></div>
  </div>}
 </div>;
}
