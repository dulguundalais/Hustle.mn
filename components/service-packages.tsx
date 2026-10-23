'use client';
import {useState,type FormEvent} from 'react';
import {Check,Clock3,RotateCcw} from 'lucide-react';
import type {Listing} from '../lib/marketplace/types';
import '../app/service-packages.css';

export type Tier='Basic'|'Standard'|'Premium';
export type ServicePackage={service_id?:string;tier:Tier;name:string;summary:string;price:number;delivery_days:number;revisions:number;includes:string[]};
export const tiers:Tier[]=['Basic','Standard','Premium'];
export function initialPackages(service:Listing|null,stored:ServicePackage[]):ServicePackage[]{
 return tiers.map(tier=>{
  const found=stored.find(x=>x.tier===tier&&x.service_id===service?.id);
  if(found)return {...found};
  return {tier,name:tier,summary:'',price:tier==='Basic'?(service?.price??10000):0,
   delivery_days:tier==='Basic'?(service?.delivery_days??7):7,
   revisions:tier==='Basic'?(service?.revisions??2):2,
   includes:tier==='Basic'?['Үндсэн үйлчилгээ / Base service']:[]};
 });
}
export function checkPackages(items:ServicePackage[]):string|null{
 if(items.length!==3||tiers.some(t=>items.filter(p=>p.tier===t).length!==1))return 'All three packages are required.';
 for(const p of items){
  if(p.name.trim().length<2||p.name.trim().length>60||p.summary.length>300)return p.tier+': package name or summary is invalid.';
  if(!Number.isInteger(p.price)||p.price<1000||p.price>100000000)return p.tier+': price must be 1,000–100,000,000 ₮.';
  if(!Number.isInteger(p.delivery_days)||p.delivery_days<1||p.delivery_days>365)return p.tier+': delivery must be 1–365 days.';
  if(!Number.isInteger(p.revisions)||p.revisions<0||p.revisions>20)return p.tier+': revisions must be 0–20.';
  if(!p.includes.length||p.includes.length>12||p.includes.some(x=>!x.trim()||x.length>120))return p.tier+': enter 1–12 included items (max 120 characters each).';
 }
 if(items[0].price>items[1].price||items[1].price>items[2].price)return 'Prices must follow Basic ≤ Standard ≤ Premium.';
 return null;
}
const money=(n:number)=>new Intl.NumberFormat('mn-MN').format(n)+' ₮';

export function PackageEditor({en,service,stored,onSave,disabled}:{en:boolean;service:Listing|null;stored:ServicePackage[];onSave:(p:ServicePackage[])=>void;disabled:boolean}){
 const [items,setItems]=useState<ServicePackage[]>(()=>initialPackages(service,stored));
 const [message,setMessage]=useState('');
 const t=(mn:string,eng:string)=>en?eng:mn;
 const set=(tier:Tier,patch:Partial<ServicePackage>)=>setItems(prev=>prev.map(p=>p.tier===tier?{...p,...patch}:p));
 function submit(e:FormEvent){e.preventDefault();const err=checkPackages(items);if(err){setMessage(err);return;}setMessage('');onSave(items)}
 return <section className="package-editor"><div className="package-editor-header"><div><h3>{t('Үйлчилгээний 3 үнийн багц','Your three service packages')}</h3><p>{t('Багц бүрийн үнэ, гүйцэтгэх хугацаа, засвар, багтах ажлыг тодорхой оруулна уу.','Set a price, delivery time, revisions and clearly defined deliverables for every tier.')}</p></div></div>
 <div className="package-editor-grid">{items.map((p,i)=><div className={'package-edit-card tier-'+p.tier.toLowerCase()} key={p.tier}><div className="package-tier-label">{p.tier}{i===1&&<span>{t('Түгээмэл','Popular')}</span>}</div><label>{t('Багцын нэр','Package title')}<input value={p.name} maxLength={60} required onChange={e=>set(p.tier,{name:e.target.value})}/></label><label>{t('Товч тайлбар','Short description')}<textarea value={p.summary} maxLength={300} rows={2} onChange={e=>set(p.tier,{summary:e.target.value})}/></label><label>{t('Үнэ (₮)','Price (MNT)')}<input type="number" min={1000} max={100000000} required value={p.price||''} onChange={e=>set(p.tier,{price:Number(e.target.value)})}/></label><div className="package-mini-fields"><label>{t('Хоног','Days')}<input type="number" min={1} max={365} value={p.delivery_days} onChange={e=>set(p.tier,{delivery_days:Number(e.target.value)})}/></label><label>{t('Засвар','Revisions')}<input type="number" min={0} max={20} value={p.revisions} onChange={e=>set(p.tier,{revisions:Number(e.target.value)})}/></label></div><label>{t('Багтсан ажлууд (мөр бүрт нэг)','Included deliverables (one per line)')}<textarea rows={6} value={p.includes.join('\n')} onChange={e=>set(p.tier,{includes:e.target.value.split('\n').map(v=>v.trim()).filter(Boolean)})} placeholder={t('Эх файл\n2 хувилбар\nЭцсийн экспорт','Source file\n2 concepts\nFinal export')}/></label><small>{p.includes.length}/12 {t('ажил','items')}</small></div>)}</div>
 {message&&<p className="package-error" role="alert">{message}</p>}<button type="button" className="button" disabled={disabled} onClick={submit}>{t('Үйлчилгээ болон 3 багцыг хадгалах','Save service and all three packages')}</button></section>;
}

export function PackagePicker({en,items,chosen,onChange}:{en:boolean;items:ServicePackage[];chosen:Tier;onChange:(tier:Tier)=>void}){
 const t=(mn:string,eng:string)=>en?eng:mn;const sorted=tiers.map(tier=>items.find(x=>x.tier===tier)).filter((x):x is ServicePackage=>!!x);
 return <div className="package-picker"><div className="package-picker-tabs" role="group" aria-label={t('Үнийн багц сонгох','Choose pricing package')}>{sorted.map(p=><button type="button" key={p.tier} aria-pressed={chosen===p.tier} className={chosen===p.tier?'active':''} onClick={()=>onChange(p.tier)}>{p.tier}</button>)}</div>{sorted.filter(p=>p.tier===chosen).map(p=><div className="package-picker-body" key={p.tier}><div className="package-picker-head"><h3>{p.name}</h3><strong>{money(p.price)}</strong></div>{p.summary&&<p>{p.summary}</p>}<div className="package-picker-metrics"><span><Clock3 size={16}/>{p.delivery_days} {t('хоног','days')}</span><span><RotateCcw size={16}/>{p.revisions} {t('засвар','revisions')}</span></div><h4>{t('Багтсан ажлууд','What’s included')}</h4><ul>{p.includes.map((line,i)=><li key={i}><Check size={16}/>{line}</li>)}</ul></div>)}</div>;
}
