'use client';
import { useState } from 'react';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: window.location.origin + '/auth/callback', shouldCreateUser: false },
      });
      setMessage(error ? 'Нэвтрэх хүсэлт амжилтгүй. Админтай холбогдоно уу.' : 'Хэрэв таны хаяг зөвшөөрөгдсөн бол нэвтрэх холбоос ирнэ.');
    } catch { setMessage('Нэвтрэх үйлчилгээ одоогоор тохируулагдаагүй байна.'); }
    finally { setLoading(false); }
  }
  return <main style={{maxWidth:440,margin:'8vh auto',padding:24}}>
    <h1>Hustle.mn — Closed beta</h1>
    <p>Зөвшөөрөгдсөн хэрэглэгчид имэйлээр нэвтэрнэ.</p>
    <form onSubmit={signIn}><label htmlFor="email">Имэйл</label>
      <input id="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} style={{display:'block',width:'100%',padding:12,margin:'12px 0',color:'#111',background:'#fff'}} />
      <button disabled={loading} type="submit">{loading?'Түр хүлээнэ үү...':'Нэвтрэх холбоос авах'}</button>
    </form><p role="status">{message}</p>
  </main>;
}
