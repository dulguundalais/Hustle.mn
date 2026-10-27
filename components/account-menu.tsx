'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {BriefcaseBusiness,ChevronDown,LayoutDashboard,LoaderCircle,LogOut,Settings2,UserRound} from 'lucide-react';

export type AccountMenuIdentity={id:string;name:string;isSeller:boolean;isAdmin?:boolean};

export default function AccountMenu({account,en,onSignOut,signingOut}:{
 account:AccountMenuIdentity;en:boolean;onSignOut:()=>Promise<void>;signingOut:boolean
}){
 const [open,setOpen]=useState(false);
 const root=useRef<HTMLDivElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 const t=(mn:string,english:string)=>en?english:mn;
 const initial=Array.from(account.name.trim())[0]?.toLocaleUpperCase()||'H';
 const dashboardHref=account.isSeller?'/seller-studio/':'/buyer/';
 useEffect(()=>{
  if(!open)return;
  const outside=(event:PointerEvent)=>{
   if(root.current&&!root.current.contains(event.target as Node))setOpen(false);
  };
  const escape=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){setOpen(false);trigger.current?.focus()}
  };
  document.addEventListener('pointerdown',outside);
  document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)};
 },[open]);
 return <div className="global-account-menu" ref={root}>
  <button type="button" ref={trigger} className={'global-account-trigger'+(open?' expanded':'')} aria-haspopup="true" aria-expanded={open}
   aria-controls="global-account-panel" aria-label={t('Хэрэглэгчийн цэс: ','Account menu: ')+account.name}
   onClick={()=>setOpen(value=>!value)} disabled={signingOut}>
   <span className="global-account-avatar" aria-hidden="true">{initial}</span>
   <span className="global-account-name">{account.name}</span>
   <ChevronDown className="global-account-chevron" size={15} aria-hidden="true"/>
  </button>
  {open&&<div id="global-account-panel" className="global-account-panel" role="group" aria-label={t('Хэрэглэгчийн тохиргоо','Account options')}>
   <div className="global-account-heading">
    <span className="global-account-avatar heading-avatar" aria-hidden="true">{initial}</span>
    <div><strong title={account.name}>{account.name}</strong><small>{t('Нэвтэрсэн хэрэглэгч','Signed in')}</small></div>
   </div>
   <div className="global-account-links">
    <Link href={dashboardHref} onClick={()=>setOpen(false)}><LayoutDashboard size={17}/>{account.isSeller?t('Мэргэжилтний самбар','Seller dashboard'):t('Миний самбар','My dashboard')}</Link>
    {account.isSeller&&<Link href="/buyer/" onClick={()=>setOpen(false)}><LayoutDashboard size={17}/>{t('Захиалагчийн самбар','Buyer dashboard')}</Link>}
    <Link href="/seller-studio/" onClick={()=>setOpen(false)}><BriefcaseBusiness size={17}/>{account.isSeller?t('Мэргэжилтний самбар','Seller Studio'):t('Үйлчилгээ үзүүлэх','Become a seller')}</Link>
    {account.isAdmin&&<Link href="/admin/" onClick={()=>setOpen(false)}><Settings2 size={17}/>{t('Админ төв','Admin console')}</Link>}
    <Link href={account.isSeller?'/my-profile/':'/buyer/?tab=profile'} onClick={()=>setOpen(false)}><UserRound size={17}/>{t('Профайл','Profile')}</Link>
   </div>
   <button type="button" className="global-account-signout" disabled={signingOut} onClick={()=>void onSignOut()}>
    {signingOut?<LoaderCircle size={17} className="spin"/>:<LogOut size={17}/>}
    {signingOut?t('Гарч байна…','Signing out…'):t('Гарах','Log out')}
   </button>
  </div>}
 </div>
}
