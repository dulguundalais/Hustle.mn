'use client';
import {useEffect,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,CheckCircle2,Eye,EyeOff,Info,LockKeyhole,Mail,ShieldCheck} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import '../app/premium-auth.css';

type Entry='buyer'|'seller'|'admin';
type Props={
  en:boolean;entry:Entry;entryMode:Entry;register:boolean;onRegisterChange:(value:boolean)=>void;
  email:string;onEmailChange:(value:string)=>void;
  password:string;onPasswordChange:(value:string)=>void;
  busy:boolean;emailCooldown:number;onSubmit:(event:FormEvent<HTMLFormElement>)=>void;
  onResend:()=>void;notice:string;error:string;onDismiss:()=>void;
};

export default function PremiumAuth({
 en,entry,entryMode,register,onRegisterChange,email,onEmailChange,password,onPasswordChange,
 busy,emailCooldown,onSubmit,onResend,notice,error,onDismiss
}:Props){
 const [showPassword,setShowPassword]=useState(false);
 const [buyerAudience,setBuyerAudience]=useState<'personal'|'business'>('personal');
 useEffect(()=>{const selected=new URLSearchParams(location.search).get('audience')||localStorage.getItem('hustle-buyer-audience');if(selected==='personal'||selected==='business')setBuyerAudience(selected)},[]);
 const chooseBuyerAudience=(next:'personal'|'business')=>{setBuyerAudience(next);try{localStorage.setItem('hustle-buyer-audience',next)}catch{}};
 const [resetMode,setResetMode]=useState(false);
 const [resetBusy,setResetBusy]=useState(false);
 const [resetMessage,setResetMessage]=useState('');
 const [resetError,setResetError]=useState('');
 const t=(mn:string,english:string)=>en?english:mn;
 const changeMode=(next:boolean)=>{
   onRegisterChange(next);setResetMode(false);setShowPassword(false);onDismiss();
 };
 const openRecovery=()=>{setResetMode(true);setResetMessage('');setResetError('');onDismiss()};
 async function recoverPassword(event:FormEvent<HTMLFormElement>){
   event.preventDefault();if(resetBusy||busy)return;
   setResetBusy(true);setResetMessage('');setResetError('');
   try{
     const db=await marketplaceClient();
     const result=await db.auth.resetPasswordForEmail(email.trim().toLowerCase(),{
       redirectTo:location.origin+'/auth/reset/'
     });
     if(result.error)throw result.error;
     setResetMessage(t('Хэрэв энэ хаягт бүртгэл байгаа бөгөөд имэйл хүргэлт тохируулагдсан бол сэргээх холбоос хүсэгдлээ. Имэйл хүрснийг баталгаажуулах боломжгүй.','If an account exists and email delivery is configured, a recovery link has been requested. Delivery is not guaranteed.'));
   }catch(error){setResetError(error instanceof Error?error.message:t('Хүсэлт амжилтгүй боллоо.','Request failed.'))}
   finally{setResetBusy(false)}
 }
 const title=entry==='admin'?t('Админ нэвтрэлт','Admin sign in'):
  resetMode?t('Нууц үг сэргээх','Reset your password'):
  register?entryMode==='seller'?t('Freelancer-ээр нэгдэх','Join as a freelancer'):t('Hustle-д нэгдэх','Create your account'):
  t('Эргэн уулзахад таатай байна.','Good to see you again.');
 return <main className="hustle-auth-scene">
  <div className="hustle-auth-glow" aria-hidden="true"/>
  <section className="hustle-auth-panel" aria-label={t('Нэвтрэлтийн хэсэг','Authentication')}>
   <div className="hustle-auth-brand" aria-label="Hustle.mn"><span className="hustle-auth-mark">H<span>✳</span></span><span>Hustle<span className="hustle-auth-dot">.mn</span></span></div>
   <div className="hustle-auth-intro"><span className="hustle-auth-eyebrow">{t('HUSTLE-Д ТАВТАЙ МОРИЛ','WELCOME TO HUSTLE')}</span><h1>{title}</h1><p>{resetMode?t('Имэйлээ оруулаад нууц үг сэргээх холбоос хүсээрэй.','Enter your email to request a password reset link.'):
     register?t('Нэг аккаунтаар үйлчилгээ авч, freelancer болж болно.','One account for hiring and offering your skills.'):
     t('Hustle дахь төслүүд, захиалга болон мессежүүдээ удирдаарай.','Sign in to manage your projects, orders and messages.')}</p></div>
   {!resetMode&&entry!=='admin'&&<div className="hustle-auth-tabs" role="group" aria-label={t('Бүртгэлийн горим','Authentication mode')}>
     <button type="button" className={!register?'active':''} aria-pressed={!register} onClick={()=>changeMode(false)}>{t('Нэвтрэх','Sign in')}</button>
     <button type="button" className={register?'active':''} aria-pressed={register} onClick={()=>changeMode(true)}>{t('Бүртгэл үүсгэх','Create account')}</button>
   </div>}
   {resetMode?<form className="hustle-auth-form" onSubmit={recoverPassword}>
     <label htmlFor="hustle-recovery-email">{t('Имэйл хаяг','Email address')}</label>
     <div className="hustle-auth-input"><Mail size={19} aria-hidden="true"/><input id="hustle-recovery-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required value={email} onChange={e=>onEmailChange(e.target.value)}/></div>
     <button className="hustle-auth-submit" disabled={resetBusy||busy} type="submit">{resetBusy?t('Илгээж байна…','Requesting…'):t('Сэргээх холбоос хүсэх','Request reset link')}<ArrowRight size={19}/></button>
   </form>:<form className="hustle-auth-form" onSubmit={onSubmit}>
     {register&&entryMode!=='seller'&&entry!=='admin'&&<fieldset className="hustle-buyer-context"><legend>{t('Та голчлон юунд ашиглах вэ?','What will you use Hustle for?')}</legend>
      <div role="group" aria-label={t('Хэрэглээний чиглэл','Buyer experience')}>
       <button type="button" aria-pressed={buyerAudience==='personal'} onClick={()=>chooseBuyerAudience('personal')}>{t('Хувийн төсөл','Personal project')}</button>
       <button type="button" aria-pressed={buyerAudience==='business'} onClick={()=>chooseBuyerAudience('business')}>{t('Бизнес / байгууллага','Business / organization')}</button>
      </div>
      <p>{t('Нэг аккаунтаар хоёуланг нь ашиглаж болно. Байгууллагын хамтарсан орон зай дараагийн хөгжүүлэлтэд нэмэгдэнэ.','One account works for both. Shared organization workspaces are planned for a later release.')}</p>
     </fieldset>}
     <label htmlFor="hustle-auth-email">{t('Имэйл хаяг','Email address')}</label>
     <div className="hustle-auth-input"><Mail size={19} aria-hidden="true"/><input id="hustle-auth-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required value={email} onChange={e=>onEmailChange(e.target.value)}/></div>
     <div className="hustle-auth-label-row"><label htmlFor="hustle-auth-password">{t('Нууц үг','Password')}</label>{!register&&<button className="hustle-auth-link" type="button" onClick={openRecovery}>{t('Нууц үгээ мартсан уу?','Forgot password?')}</button>}</div>
     <div className="hustle-auth-input"><LockKeyhole size={19} aria-hidden="true"/><input id="hustle-auth-password" name="password" type={showPassword?'text':'password'} autoComplete={register?'new-password':'current-password'} placeholder={t('Доод тал нь 8 тэмдэгт','At least 8 characters')} minLength={8} required value={password} onChange={e=>onPasswordChange(e.target.value)}/><button type="button" className="hustle-auth-visibility" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?t('Нууц үгийг нуух','Hide password'):t('Нууц үгийг харах','Show password')} aria-pressed={showPassword}>{showPassword?<EyeOff size={19}/>:<Eye size={19}/>}</button></div>
     <button className="hustle-auth-submit" disabled={busy||(register&&emailCooldown>0)} type="submit">{busy?t('Шалгаж байна…','Please wait…'):register?t('Бүртгэл үүсгэх','Create account'):t('Нэвтрэх','Sign in')}<ArrowRight size={19}/></button>
   </form>}
   {(error||resetError||notice||resetMessage)&&<div className={'hustle-auth-feedback '+(error||resetError?'is-error':'is-success')} role={error||resetError?'alert':'status'}>
     {error||resetError?<Info size={19} aria-hidden="true"/>:<CheckCircle2 size={19} aria-hidden="true"/>}
     <div><p>{resetError||error||resetMessage||notice}</p>{(notice||error)&&!resetMode&&entry!=='admin'&&<div className="hustle-auth-feedback-actions"><button type="button" onClick={()=>changeMode(false)}>{t('Нэвтрэх','Sign in')}</button><button type="button" onClick={openRecovery}>{t('Нууц үг сэргээх','Reset password')}</button></div>}</div>
   </div>}
   {resetMode?<div className="hustle-auth-support"><button type="button" onClick={()=>{setResetMode(false);setResetError('');setResetMessage('')}}><ArrowLeft size={15}/>{t('Нэвтрэх рүү буцах','Back to sign in')}</button></div>:
     <div className="hustle-auth-support">{entry==='admin'?<span className="hustle-auth-beta"><ShieldCheck size={15}/>{t('Зөвхөн эрх бүхий админ','Authorized administrators only')}</span>:
       <><p>{register?t('Бүртгэлтэй юу?','Already have an account?'):t('Hustle-д шинээр нэгдэх үү?','New to Hustle?')} <button type="button" onClick={()=>changeMode(!register)}>{register?t('Нэвтрэх','Sign in'):t('Бүртгэл үүсгэх','Create account')}</button></p>
       {register&&<p className="hustle-auth-legal">{t('Өмнө бүртгүүлсэн имэйлтэй бол шинээр бүртгүүлэхийн оронд нэвтрэх буюу нууц үгээ сэргээнэ үү.','Already registered? Sign in or reset your password instead of signing up again.')}</p>}
       {register&&<button type="button" className="hustle-auth-resend" disabled={busy||emailCooldown>0} onClick={onResend}>{emailCooldown>0?t('Дахин хүсэлт өгөх боломж түр хаалттай','Resend temporarily paused'):t('Баталгаажуулах хүсэлт дахин өгөх','Request confirmation again')}</button>}</>}
     </div>}
   <div className="hustle-auth-footer"><Link href="/explore/"><ArrowLeft size={16}/>{t('Үйлчилгээ үзэх','Explore the marketplace')}</Link></div>
  </section>
 </main>;
}
