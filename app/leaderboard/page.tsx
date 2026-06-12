'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Nav } from '@/components/Nav';

interface LbEntry{id?:string;name:string;emoji:string;pts:number;exact:number;correct:number;wrong:number;total:number;rank:number;}

function celebrateLbFirst(e:LbEntry){
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:990;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;animation:fadeInBg 0.3s ease-out';
  overlay.innerHTML=`<div style="font-size:90px;animation:exactBurst 0.6s cubic-bezier(.17,.67,.35,1.3) forwards">🏆</div><div style="font-size:26px;font-weight:900;color:#fde68a;text-align:center">You're #1, ${e.name}! ❤️</div><div style="font-size:16px;color:rgba(255,255,255,0.7)">${e.pts} points — keep it up!</div><button onclick="this.parentElement.remove()" style="margin-top:12px;background:#1e7a42;border:none;color:white;font-weight:700;font-size:14px;padding:12px 28px;border-radius:14px;cursor:pointer">Let's go! 🚀</button>`;
  document.body.appendChild(overlay);
  const c=['#f5c842','#fde68a','#f59e0b','#fff','#ff6b35','#34d399'];
  for(let i=0;i<60;i++){const p=document.createElement('div');p.className='confetti-p';p.style.cssText=`left:${Math.random()*100}%;width:${5+Math.random()*10}px;height:${5+Math.random()*10}px;background:${c[i%6]};border-radius:${i%3?'50%':'2px'};animation-delay:${Math.random()*0.7}s`;document.body.appendChild(p);setTimeout(()=>p.remove(),3800);}
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [lb, setLb] = useState<LbEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!user) router.replace('/login'); }, [user]);

  const load = useCallback(async () => {
    const r = await fetch('/api/leaderboard');
    const d = await r.json();
    if (d.leaderboard) setLb(d.leaderboard);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  // Reload every 30s
  useEffect(() => { const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  if (!user) return null;

  const me = lb.find(e => e.name === user.username);
  const leader = lb[0];
  const medals = ['🥇','🥈','🥉'];

  return (
    <div className="page">
      <div style={{padding:'22px 16px 0',textAlign:'center'}}>
        <p style={{fontSize:11,color:'rgba(255,255,255,0.35)',letterSpacing:2,textTransform:'uppercase',marginBottom:3}}>The Squad Table</p>
        <h2 style={{fontSize:26,fontWeight:900,marginBottom:18}}>🏆 Leaderboard</h2>
        {!loading&&leader&&leader.pts>0&&(
          <div className="gold-card" style={{marginBottom:18,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
            <div className="float" style={{fontSize:42,filter:'drop-shadow(0 0 14px rgba(245,200,66,0.65))'}}>🏆</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.4)'}}>Currently leading</div>
            <div style={{fontSize:22,fontWeight:900}}>{leader.emoji} {leader.name}</div>
            <div style={{fontSize:34,fontWeight:900,color:'#fde68a'}}>{leader.pts} pts</div>
          </div>
        )}
        {!loading&&(!leader||leader.pts===0)&&<div style={{marginBottom:16,color:'rgba(255,255,255,0.3)',fontSize:13}}>No points yet — matches coming! ⚽</div>}
      </div>
      <div style={{padding:'0 14px 14px'}}>
        {loading?[1,2,3,4,5,6,7,8].map(i=><div key={i} className="shimmer"/>):(
          <>
            {lb.map((e,i)=>{
              const isMe=e.name===user.username;
              return (
                <div key={e.name} className="lb-row" style={{background:isMe?'linear-gradient(135deg,rgba(30,122,66,0.22),rgba(39,163,86,0.12))':'rgba(255,255,255,0.04)',borderColor:isMe?'rgba(39,163,86,0.35)':'rgba(255,255,255,0.07)'}}>
                  <div style={{width:32,textAlign:'center',flexShrink:0}}>
                    {medals[i]?<span style={{fontSize:24}}>{medals[i]}</span>:<span style={{fontSize:15,fontWeight:700,color:i===2?'#60a5fa':'rgba(255,255,255,0.3)'}}>{i+1}</span>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                      <span style={{fontSize:18}}>{e.emoji}</span>
                      <span style={{fontWeight:800,fontSize:14}}>{e.name}</span>
                      {isMe&&<span style={{fontSize:10,color:'#4ade80',fontWeight:700}}>You</span>}
                    </div>
                    <div style={{display:'flex',gap:10,fontSize:11,color:'rgba(255,255,255,0.35)'}}>
                      <span>⚡{e.exact}</span><span>✅{e.correct}</span><span>❌{e.wrong}</span><span>🎯{e.total}</span>
                    </div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:22,fontWeight:900,color:i===0?'#fde68a':i===1?'#d1d5db':i===2?'#60a5fa':'white'}}>{e.pts}</div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,0.25)',fontWeight:700}}>PTS</div>
                  </div>
                </div>
              );
            })}
            <div style={{marginTop:16,padding:'12px 14px',background:'rgba(255,255,255,0.03)',borderRadius:12,fontSize:13}}>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.28)',marginBottom:7,fontWeight:700,textTransform:'uppercase',letterSpacing:.4}}>Scoring</div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <div>⚡ <b>3 pts</b> — Exact score</div>
                <div>✅ <b>2 pts</b> — Correct outcome</div>
                <div>❌ <b>1 pt</b> — Wrong prediction</div>
                <div>🚫 <b>0 pts</b> — Didn't predict</div>
              </div>
            </div>
            {me&&me.pts>0&&(
              <button onClick={()=>{ if(me.rank===1)celebrateLbFirst(me); }} style={{marginTop:8,width:'100%',background:'rgba(245,200,66,0.1)',border:'1px solid rgba(245,200,66,0.2)',borderRadius:12,padding:'10px',color:'#fde68a',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                🎉 Your rank: #{me.rank} · {me.pts} pts
              </button>
            )}
          </>
        )}
      </div>
      <Nav/>
    </div>
  );
}
