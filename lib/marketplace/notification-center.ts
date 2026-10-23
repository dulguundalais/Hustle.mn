// V35.4 — View model only. All visibility is enforced by the existing Supabase RLS.
export type ProjectEvent={id:string;recipient_id:string;request_id:string;kind:string;created_at:string;read_at:string|null};
export type OrderEvent={id:string;recipient_id:string;order_id:string;kind:string;created_at:string;read_at:string|null};
export type ChatEvent={id:string;sender_id:string;recipient_id:string;created_at:string;read_at:string|null};
export type UnifiedNotice={
 key:string;id:string;source:'project'|'order'|'chat';kind:string;createdAt:string;read:boolean;
 href:string;titleMn:string;titleEn:string;count:number
};
const projects:Record<string,[string,string,string]>={
 invitation:['Шинэ төслийн урилга','New project invitation','/seller-requests/'],
 proposal:['Таны төсөлд санал ирлээ','New proposal received','/project-requests/'],
 awarded:['Таны саналыг сонголоо','Your proposal was selected','/seller-requests/'],
 cancelled:['Төслийн хүсэлт цуцлагдлаа','Project request cancelled','/seller-requests/']
};
const orders:Record<string,[string,string,string]>={
 requested:['Шинэ захиалга','New order received','/seller-studio/?tab=seller-orders'],
 accepted:['Захиалга зөвшөөрөгдлөө','Order accepted','/buyer/?tab=orders'],
 in_progress:['Захиалгын ажил эхэллээ','Order in progress','/buyer/?tab=orders'],
 delivered:['Ажил хүлээлгэн өглөө','Work delivered','/buyer/?tab=orders'],
 completed:['Захиалга дууслаа','Order completed','/seller-studio/?tab=seller-orders'],
 rejected:['Захиалгаас татгалзлаа','Order rejected','/buyer/?tab=orders'],
 cancelled:['Захиалга цуцлагдлаа','Order cancelled','/seller-studio/?tab=seller-orders'],
 revision_requested:['Засвар хүссэн байна','Revision requested','/seller-studio/?tab=seller-orders']
};
export function combineNotices(project:ProjectEvent[],order:OrderEvent[],messages:ChatEvent[]):{
 items:UnifiedNotice[];unread:number;chatUnread:number;projectUnread:number;orderUnread:number
}{
 const seen=new Map<string,UnifiedNotice>();
 for(const e of project){
  if(!projects[e.kind])continue;
  const [titleMn,titleEn,href]=projects[e.kind];
  seen.set('project:'+e.id,{key:'project:'+e.id,id:e.id,source:'project',kind:e.kind,createdAt:e.created_at,read:Boolean(e.read_at),titleMn,titleEn,href,count:1});
 }
 for(const e of order){
  if(!orders[e.kind])continue;
  const [titleMn,titleEn,href]=orders[e.kind];
  seen.set('order:'+e.id,{key:'order:'+e.id,id:e.id,source:'order',kind:e.kind,createdAt:e.created_at,read:Boolean(e.read_at),titleMn,titleEn,href,count:1});
 }
 const chatUnread=messages.filter(m=>!m.read_at).length;
 for(const e of messages){
  if(e.read_at)continue;
  const key='chat:'+e.sender_id;
  const current=seen.get(key);
  if(current){
   current.count++;
   if(e.created_at>current.createdAt)current.createdAt=e.created_at;
  }else{
   seen.set(key,{key,id:e.sender_id,source:'chat',kind:'message',createdAt:e.created_at,read:false,titleMn:'Шинэ чат мессеж',titleEn:'New chat messages',href:'/buyer/?tab=messages',count:1});
  }
 }
 const items=Array.from(seen.values()).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,40);
 const projectUnread=project.filter(n=>!n.read_at).length;
 const orderUnread=order.filter(n=>!n.read_at).length;
 return {items,unread:projectUnread+orderUnread+chatUnread,chatUnread,projectUnread,orderUnread};
}
export function badgeCount(count:number){return count>99?'99+':String(Math.max(0,count))}
