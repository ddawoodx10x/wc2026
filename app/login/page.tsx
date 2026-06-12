'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { USERS_LIST } from '@/lib/fixtures-data';

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'pick'|'pw'|'newpw'>('pick');
  const [sel, setSel] = useState<typeof USERS_LIST[0] | null>(null);
  const [pw, setPw] = useState('');
  const [cf, setCf] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedName, setSavedName] = useState<string|null>(null);

  useEffect(() => {
    if (user) router.replace('/fixtures');
    const s = localStorage.getItem('wc_session');
    setSavedName(s);
  }, [user]);

  const pick = async (u: typeof USERS_LIST[0]) => {
    setSel(u); setErr(''); setPw(''); setCf('');
    const r = await fetch('/api/auth/check', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username: u.name }) });
    const d = await r.json();
    setStep(d.exists ? 'pw' : 'newpw');
  };

  const submit = async () => {
    if (!sel) return;
    if (!pw) { setErr('Enter a password'); return; }
    if (step === 'newpw') {
      if (pw.length < 4) { setErr('Min 4 characters'); return; }
      if (pw !== cf) { setErr("Passwords don't match"); return; }
    }
    setBusy(true); setErr('');
    const result = step === 'pw' ? await login(sel.name, pw) : await register(sel.name, pw);
    setBusy(false);
    if (result.error) setErr(result.error);
    else router.replace('/fixtures');
  };

  const visibleUsers = savedName ? USERS_LIST.filter(u => u.name === savedName) : USERS_LIST;

  return (
    <div className="login-wrap">
      <div style={{ textAlign:'center', marginBottom:28 }}>
        <div className="float" style={{ fontSize:52, filter:'drop-shadow(0 0 20px rgba(245,200,66,0.55))' }}>🏆</div>
        <h1 style={{ fontSize:28, fontWeight:900, background:'linear-gradient(135deg,#f5c842,#fff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'8px 0 3px', letterSpacing:'-.5px' }}>World Cup 2026</h1>
        <p style={{ color:'rgba(255,255,255,0.38)', fontSize:11, letterSpacing:'2.5px', textTransform:'uppercase' }}>The Lads · Prediction Game</p>
        <div style={{ marginTop:14, position:'relative', width:90, height:80, margin:'14px auto 0' }}>
          <svg viewBox="-20 0 130 80" width="130" height="80" style={{ overflow:'visible' }}>
            <rect x="8" y="18" width="2.5" height="44" fill="white" opacity="0.9" rx="1"/>
            <rect x="8" y="18" width="54" height="2.5" fill="white" opacity="0.9" rx="1"/>
            <rect x="60" y="18" width="2.5" height="44" fill="white" opacity="0.9" rx="1"/>
            <line x1="16" y1="20" x2="16" y2="62" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>
            <line x1="24" y1="20" x2="24" y2="62" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>
            <line x1="32" y1="20" x2="32" y2="62" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>
            <line x1="40" y1="20" x2="40" y2="62" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>
            <line x1="48" y1="20" x2="48" y2="62" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>
            <line x1="56" y1="20" x2="56" y2="62" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>
            <line x1="8" y1="28" x2="62" y2="28" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>
            <line x1="8" y1="36" x2="62" y2="36" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>
            <line x1="8" y1="44" x2="62" y2="44" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>
            <line x1="8" y1="52" x2="62" y2="52" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>
            <rect x="5" y="62" width="80" height="2" fill="rgba(255,255,255,0.3)" rx="1"/>
            <g id="goal-ball" style={{ animation:'ballLoop 3.2s ease-in-out infinite' }}>
              <circle cx="75" cy="56" r="9" fill="white"/>
              <path d="M75 49 L79 52 L78 57 L72 57 L71 52 Z" fill="#222"/>
              <path d="M75 49 L80 51 L83 47 L78 45 L74 47 Z" fill="#222" opacity="0.5"/>
              <path d="M75 49 L70 51 L67 47 L72 45 L76 47 Z" fill="#222" opacity="0.5"/>
            </g>
            <text id="goal-text" x="34" y="12" textAnchor="middle" fontSize="10" fontWeight="900" fill="#f5c842" fontFamily="Arial,sans-serif" style={{ animation:'goalPop 3.2s ease-in-out infinite', opacity:0 }}>GOAL!</text>
          </svg>
        </div>
        <div style={{ display:'flex', justifyContent:'center', gap:14, margin:'14px 0 0', alignItems:'center' }}>
          {['⚽','🏅','🏆','🏅','⚽'].map((ic, i) => (
            <span key={i} style={{ fontSize: i===2?22:18, animation:`iconBob 2s ease-in-out ${i*0.3}s infinite`, display:'inline-block' }}>{ic}</span>
          ))}
        </div>
      </div>

      {step === 'pick' && (
        <div style={{ width:'100%', maxWidth:340 }}>
          <p style={{ textAlign:'center', color:'rgba(255,255,255,0.55)', marginBottom:16, fontSize:14 }}>
            {savedName ? `Welcome back! 👋` : 'Who are you? 👇'}
          </p>
          <div className="u-grid" style={{ gridTemplateColumns: savedName ? '1fr' : '1fr 1fr' }}>
            {visibleUsers.map(u => (
              <button key={u.name} className="u-btn" onClick={() => pick(u)}>
                <span style={{ fontSize:30 }}>{u.emoji}</span>
                {u.name}
              </button>
            ))}
          </div>
          {savedName && (
            <button onClick={() => setSavedName(null)} style={{ marginTop:12, width:'100%', background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:12 }}>
              Not {savedName}? Switch account
            </button>
          )}
          <p style={{ textAlign:'center', color:'rgba(255,255,255,0.18)', fontSize:11, marginTop:16 }}>Private · Squad only 🤝</p>
        </div>
      )}

      {(step === 'pw' || step === 'newpw') && sel && (
        <div style={{ width:'100%', maxWidth:330 }}>
          <div className="card" style={{ padding:24 }}>
            <button onClick={() => setStep('pick')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:13, marginBottom:14, padding:0 }}>← Back</button>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:36, marginBottom:8 }}>{sel.emoji}</div>
              <div style={{ fontWeight:800, fontSize:18 }}>{step==='pw' ? `Welcome back, ${sel.name}!` : `Hey ${sel.name}!`}</div>
              <div style={{ color:'rgba(255,255,255,0.42)', fontSize:12, marginTop:3 }}>{step==='pw' ? 'Enter your password' : 'First time — create a password'}</div>
            </div>
            <input type="password" className="w-full" placeholder="Password" value={pw} onChange={e=>{setPw(e.target.value);setErr('')}} onKeyDown={e=>e.key==='Enter'&&submit()} style={{ width:'100%', marginBottom:10 }}/>
            {step==='newpw' && <input type="password" placeholder="Confirm password" value={cf} onChange={e=>{setCf(e.target.value);setErr('')}} onKeyDown={e=>e.key==='Enter'&&submit()} style={{ width:'100%', marginBottom:10 }}/>}
            {err && <div style={{ background:'rgba(185,28,28,0.15)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:'9px 12px', color:'#fca5a5', fontSize:12, marginBottom:10 }}>{err}</div>}
            <button className="btn-g" onClick={submit} disabled={busy}>{busy ? '...' : step==='pw' ? 'Let me in ⚽' : "I'm in! 🚀"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
