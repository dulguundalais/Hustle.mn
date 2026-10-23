'use client';
import {useEffect,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,Eye,EyeOff,LockKeyhole,ShieldCheck} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import '../app/premium-auth.css';

export default function ResetPassword(){
 const [password,setPassword]=useState(''),[repeat,setRepeat]=useState('');
 const [visible,setVisible]=useState(false),[loading,setLoading]=useState(true);
 const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState('');
 useEffect(()=>{
   let active=true;
   let cleanup=()=>{};
   void marketplaceClient().then(async db=>{
     const {data:{subscription}}=db.auth.onAuthStateChange((event,session)=>{
       if(!active)return;
       if(event==='PASSWORD_RECOVERY'&&session){setReady(true);setLoading(false)}
     });
     cleanup=()=>subscription.unsubscribe();
     // Browser Supabase client detects recovery tokens via URL. Without a
     // valid recovery session we must never allow an unauthenticated password update.
     const session=await db.auth.getSession();
     if(!active)return;
     const url=new URL(location.href);
     if(session.data.session&&((url.searchParams.get('type')==='recovery')||url.hash.includes('type=recovery'))){setReady(true)}
     setLoading(false);
   }).catch(()=>{if(active){setError('Unable to verify recovery session.');setLoading(false)}});
   return()=>{active=false;cleanup()};
 },[]);
 async function save(e:FormEvent<HTMLFormElement>){
   e.preventDefault();if(!ready||busy)return;
   if(password.length<8||password!==repeat){setError('Passwords must match and contain at least 8 characters.');return}
   setBusy(true);setError('');
   try{
     const db=await marketplaceClient();
     const r=await db.auth.updateUser({password});
     if(r.error)throw r.error;
     setNotice('Your password has been updated. You can now sign in.');
     setPassword('');setRepeat('');setReady(false);
     await db.auth.signOut();
   }catch(e){setError(e instanceof Error?e.message:'Could not update password.')}
   finally{setBusy(false)}
 }
 return <main className="hustle-auth-scene"><section className="hustle-auth-panel">
   <div className="hustle-auth-brand"><span className="hustle-auth-mark">H<span>✳</span></span>Hustle<span className="hustle-auth-dot">.mn</span></div>
   <div className="hustle-auth-intro"><span className="hustle-auth-eyebrow">ACCOUNT RECOVERY</span><h1>Choose a new password.</h1><p>Secure your Hustle account with a password of at least 8 characters.</p></div>
   {loading?<p role="status">Checking recovery link…</p>:ready?<form className="hustle-auth-form" onSubmit={save}>
     <label htmlFor="reset-pass">New password</label><div className="hustle-auth-input"><LockKeyhole size={18}/><input id="reset-pass" type={visible?'text':'password'} autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" className="hustle-auth-visibility" onClick={()=>setVisible(v=>!v)} aria-label={visible?'Hide password':'Show password'}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
     <label htmlFor="reset-repeat">Confirm new password</label><div className="hustle-auth-input"><ShieldCheck size={18}/><input id="reset-repeat" type={visible?'text':'password'} autoComplete="new-password" minLength={8} required value={repeat} onChange={e=>setRepeat(e.target.value)}/></div>
     <button className="hustle-auth-submit" disabled={busy}>{busy?'Saving…':'Update password'}<ArrowRight size={18}/></button>
   </form>:!notice?<div className="hustle-auth-feedback" role="status">Your password reset link is missing, expired, or already used. Request a new link from the sign-in page.</div>:null}
   {error&&<div className="hustle-auth-feedback is-error" role="alert">{error}</div>}
   {notice&&<div className="hustle-auth-feedback is-success" role="status">{notice}</div>}
   <div className="hustle-auth-footer"><Link href="/login/"><ArrowLeft size={16}/>Back to sign in</Link></div>
 </section></main>
}