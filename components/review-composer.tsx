'use client';
import {useState,type FormEvent} from 'react';
import {Star,CheckCircle2,Send} from 'lucide-react';
import type {Order} from '../lib/marketplace/types';
import type {VerifiedReview} from '../lib/marketplace/reviews';
import '../app/verified-reviews.css';
export default function ReviewComposer({order,en,existing,busy,onSubmit}:{order:Order;en:boolean;existing?:VerifiedReview;busy:boolean;onSubmit:(rating:number,body:string)=>Promise<void>}){
 const [rating,setRating]=useState(5),[body,setBody]=useState('');
 const [hover,setHover]=useState(0),[saving,setSaving]=useState(false);
 const t=(mn:string,eng:string)=>en?eng:mn;
 if(existing)return <div className="review-existing"><CheckCircle2 size={18}/><div><strong>{t('Баталгаажсан үнэлгээ','Verified review')} · {existing.rating}/5</strong><p>{existing.body}</p><small>{t('Дууссан захиалгад тулгуурласан','From a completed order')}</small></div></div>;
 const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();if(body.trim().length<10||body.trim().length>2000)return;setSaving(true);try{await onSubmit(rating,body.trim());setBody('')}finally{setSaving(false)}};
 return <form className="review-composer" onSubmit={submit}><div className="review-composer-header"><Star size={21}/><div><h4>{t('Мэргэжилтэнд үнэлгээ өгөх','Review your freelancer')}</h4><p>{t('Дууссан захиалга бүрт нэг удаа үнэлгээ өгнө.','One verified review per completed order.')}</p></div></div><fieldset><legend>{t('Ажилд хэр сэтгэл хангалуун байсан бэ?','How was your experience?')}</legend><div className="review-star-input" role="group" aria-label={t('1-5 од сонгох','Select 1 to 5 stars')}>{[1,2,3,4,5].map(n=><button type="button" key={n} aria-label={n+' '+t('од','stars')} aria-pressed={rating===n} onMouseEnter={()=>setHover(n)} onMouseLeave={()=>setHover(0)} onFocus={()=>setHover(n)} onBlur={()=>setHover(0)} onClick={()=>setRating(n)}><Star size={29} fill={n<=(hover||rating)?'currentColor':'none'}/></button>)}</div></fieldset><label htmlFor={'review-'+order.id}>{t('Ажлын талаар сэтгэгдлээ бичээрэй','Your honest experience')}<textarea id={'review-'+order.id} minLength={10} maxLength={2000} rows={4} required placeholder={t('Харилцаа, чанар, хугацаа, хамтын ажиллагааны тухай…','Share what worked well and what could be improved…')} value={body} onChange={e=>setBody(e.target.value)}/></label><div className="review-composer-foot"><small>{body.trim().length}/2000 · {t('Үнэлгээг хадгалсны дараа засах боломжгүй','Reviews cannot be edited after submission')}</small><button className="button small" type="submit" disabled={busy||saving||body.trim().length<10}><Send size={15}/>{saving?t('Илгээж байна…','Submitting…'):t('Үнэлгээ нийтлэх','Publish review')}</button></div></form>;
}
