'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Nav } from '@/components/Nav';

interface LbEntry{id?:string;name:string;emoji:string;pts:number;exact:number;correct:number;wrong:number;total:number;rank:number;}

function spawnConfetti(cols:string[],count=50){
  for(let i=0;i<count;i++){
    const p=document.createElement('div');
    const size=5+Math.random()*10;
    p.style.cssText=`position:fixed;top:-20px;left:${Math.random()*100}%;width:${size}px;height:${size}px;background:${cols[i%cols.length]};border-radius:${i%3?'50%':'3px'};pointer-events:none;z-index:9999;animation:lbFall ${2+Math.random()*1.5}s ease-in forwards;animation-delay:${Math.random()*0.8}s`;
    document.body.appendChild(p);
    setTimeout(()=>p.remove(),4500);
  }
}

function celebrateRank1(entry: LbEntry){
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9990;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;animation:lbFadeIn 0.4s ease-out;cursor:pointer';
  overlay.onclick=()=>overlay.remove();
  overlay.innerHTML=`<div style="font-size:100px;animation:lbBurst 0.7s cubic-bezier(.17,.67,.35,1.3) forwards;filter:drop-shadow(0 0 40px rgba(245,200,66,1))">🏆</div><div style="font-size:32px;font-weight:900;color:#fde68a;text-align:center;line-height:1.3;text-shadow:0 0 30px rgba(245,200,66,0.8)">${entry.emoji} ${entry.name}</div><div style="font-size:20px;color:white;font-weight:700">You're #1! 👑</div><div style="font-size:52px;font-weight:900;color:#fde68a;text-shadow:0 0 20px rgba(245,200,66,0.9)">${entry.pts} pts</div><div style="font-size:13px;color:rgba(255,255,255,0.45);margin-top:4px">Tap anywhere to close</div>`;
  document.body.appendChild(overlay);
  spawnConfetti(['#f5c842','#fde68a','#f59e0b','#fff','#ff6b35','#34d399','#c084fc'],90);
}

function celebrateRank2(entry: LbEntry){
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9990;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;animation:lbFadeIn 0.4s ease-out;cursor:pointer';
  overlay.onclick=()=>overlay.remove();
  overlay.innerHTML=`<div style="font-size:90px;animation:lbBurst 0.6s cubic-bezier(.17,.67,.35,1.3) forwards;filter:drop-shadow(0 0 30px rgba(209,213,219,0.9))">🥈</div><div style="font-size:26px;font-weight:900;color:#d1d5db;text-align:center">${entry.emoji} ${entry.name}</div><div style="font-size:18px;color:rgba(255,255,255,0.8);font-weight:700">#2 — So close! 💪</div><div style="font-size:44px;font-weight:900;color:#d1d5db">${entry.pts} pts</div><div style="font-size:13px;color:rgba(255,255,255,0.4)">Tap to close</div>`;
  document.body.appendChild(overlay);
  spawnConfetti(['#d1d5db','#e5e7eb','#9ca3af','#fff','#60a5fa'],50);
}

function celebrateRank3(entry: LbEntry){
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9990;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;animation:lbFadeIn 0.4s ease-out;cursor:pointer';
  overlay.onclick=()=>overlay.remove();
  overlay.innerHTML=`<div style="font-size:88px;animation:lbBurst 0.6s cubic-bezier(.17,.67,.35,1.3) forwards;filter:drop-shadow(0 0 24px rgba(96,165,250,0.9))">🥉</div><div style="font-size:24px;font-weight:900;color:#93c5fd;text-align:center">${entry.emoji} ${entry.name}</div><div style="font-size:17px;color:rgba(255,255,255,0.7);font-weight:700">#3 — Top 3 baby! 🔥</div><div style="font-size:42px;font-weight:900;color:#60a5fa">${entry.pts} pts</div><div style="font-size:13px;color:rgba(255,255,255,0.4)">Tap to close</div>`;
  document.body.appendChild(overlay);
  spawnConfetti(['#60a5fa','#93c5fd','#bfdbfe','#fff','#4ade80'],40);
}

function celebrateOtherRank(entry: LbEntry){
  const banner=document.createElement('div');
  banner.style.cssText=`position:fixed;top:80px;left:50%;transform:translateX(-50%) translateY(-12px);z-index:9991;background:rgba(20,20,40,0.97);border:1px solid rgba(255,255,255,0.12);border-radius:18px;padding:16px 24px;text-align:center;animation:lbSlideDown 0.4s ease-out forwards;pointer-events:none;min-width:240px`;
  banner.innerHTML=`<div style="font-size:32px;margin-bottom:6px">${entry.emoji}</div><div style="font-size:16px;font-weight:800;color:white;margin-bottom:3px">${entry.name}</div><div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:8px">Rank #${entry.rank}</div><div style="font-size:28px;font-weight:900;color:white">${entry.pts} pts</div><div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:4px">⚡${entry.exact} exact · ✅${entry.correct} correct · 🎯${entry.total} picks</div>`;
  document.body.appendChild(banner);
  setTimeout(()=>{banner.style.transition='opacity 0.4s,transform 0.4s';banner.style.opacity='0';banner.style.transform='translateX(-50%) translateY(-20px)';setTimeout(()=>banner.remove(),400);},2500);
}

function triggerCelebration(me: LbEntry){
  if(typeof window==='undefined')return;
  if(me.rank===1)celebrateRank1(me);
  else if(me.rank===2)celebrateRank2(me);
  else if(me.rank===3)celebrateRank3(me);
  else celebrateOtherRank(me);
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
  useEffect(() => { const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  // Fire every time leaderboard loads and user has points
  useEffect(() => {
    if (!user || loading || lb.length === 0) return;
    const me = lb.find(e => e.name === user.username);
    if (!me || me.pts === 0) return;
    const timer = setTimeout(() => triggerCelebration(me), 800);
    return () => clearTimeout(timer);
  }, [loading, user]);

  if (!user) return null;

  const medals = ['🥇','🥈','🥉'];
  const leader = lb[0];

  return (
    <div className="page">
      <style>{`
        @keyframes lbFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}
        @keyframes lbBurst{0%{transform:scale(0.2);opacity:0}60%{transform:scale(1.3);opacity:1}100%{transform:scale(1);opacity:1}}
        @keyframes lbFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes lbSlideDown{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes lbPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .me-row{animation:lbPulse 2.5s ease-in-out infinite}
      `}</style>

      <div style={{padding:'22px 16px 0',textAlign:'center'}}>
        <p style={{fontSize:11,color:'rgba(255,255,255,0.35)',letterSpacing:2,textTransform:'uppercase',marginBottom:3}}>The Squad Table</p>
        <h2 style={{fontSize:26,fontWeight:900,marginBottom:18}}>🏆 Leaderboard</h2>
        {!loading && leader && leader.pts > 0 && (
          <div className="gold-card" style={{marginBottom:18,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
            <div style={{fontSize:42,filter:'drop-shadow(0 0 14px rgba(245,200,66,0.65))',animation:'lbPulse 2s ease-in-out infinite',display:'inline-block'}}>🏆</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.4)'}}>Currently leading</div>
            <div style={{fontSize:22,fontWeight:900}}>{leader.emoji} {leader.name}</div>
            <div style={{fontSize:34,fontWeight:900,color:'#fde68a'}}>{leader.pts} pts</div>
          </div>
        )}
        {!loading && (!leader || leader.pts === 0) && (
          <div style={{marginBottom:16,color:'rgba(255,255,255,0.3)',fontSize:13}}>No points yet — matches coming! ⚽</div>
        )}
      </div>

      <div style={{padding:'0 14px 14px'}}>
        {loading ? [1,2,3,4,5,6,7,8].map(i=>(
          <div key={i} style={{background:'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.5s infinite',borderRadius:16,height:80,marginBottom:8}}/>
        )) : (
          <>
            {lb.map((e,i) => {
              const isMe = e.name === user.username;
              const rankColor = i===0?'#fde68a':i===1?'#d1d5db':i===2?'#60a5fa':'rgba(255,255,255,0.3)';
              const rowBg = i===0?'linear-gradient(135deg,rgba(245,200,66,0.1),rgba(200,155,20,0.06))':i===1?'linear-gradient(135deg,rgba(209,213,219,0.07),rgba(156,163,175,0.04))':i===2?'linear-gradient(135deg,rgba(96,165,250,0.08),rgba(59,130,246,0.04))':'rgba(255,255,255,0.04)';
              const rowBorder = isMe?'rgba(39,163,86,0.4)':i===0?'rgba(245,200,66,0.2)':i===1?'rgba(209,213,219,0.12)':i===2?'rgba(96,165,250,0.15)':'rgba(255,255,255,0.07)';
              return (
                <div
                  key={e.name}
                  className={isMe?'me-row':''}
                  onClick={() => { if(isMe) triggerCelebration(e); }}
                  style={{borderRadius:16,padding:'14px 16px',display:'flex',alignItems:'center',gap:12,marginBottom:8,border:`1px solid ${rowBorder}`,background:isMe?'linear-gradient(135deg,rgba(30,122,66,0.22),rgba(39,163,86,0.12))':rowBg,cursor:isMe?'pointer':'default'}}
                >
                  <div style={{width:36,textAlign:'center',flexShrink:0}}>
                    {medals[i]?<span style={{fontSize:26}}>{medals[i]}</span>:<span style={{fontSize:16,fontWeight:900,color:rankColor}}>{i+1}</span>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                      <span style={{fontSize:20}}>{e.emoji}</span>
                      <span style={{fontWeight:800,fontSize:15}}>{e.name}</span>
                      {isMe&&<span style={{fontSize:10,background:'rgba(39,163,86,0.3)',color:'#4ade80',fontWeight:700,padding:'2px 7px',borderRadius:8}}>You</span>}
                    </div>
                    <div style={{display:'flex',gap:10,fontSize:11,color:'rgba(255,255,255,0.35)'}}>
                      <span style={{color:'#fde68a'}}>⚡{e.exact}</span>
                      <span style={{color:'#4ade80'}}>✅{e.correct}</span>
                      <span>❌{e.wrong}</span>
                      <span>🎯{e.total} picks</span>
                    </div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:26,fontWeight:900,color:rankColor,lineHeight:1}}>{e.pts}</div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,0.25)',fontWeight:700,marginTop:2}}>PTS</div>
                  </div>
                </div>
              );
            })}
            <div style={{marginTop:16,padding:'14px 16px',background:'rgba(255,255,255,0.03)',borderRadius:14,fontSize:13}}>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.28)',marginBottom:8,fontWeight:700,textTransform:'uppercase',letterSpacing:.5}}>Scoring System</div>
              <div style={{display:'flex',flexDirection:'column',gap:5}}>
                <div style={{display:'flex',justifyContent:'space-between'}}><span>⚡ Exact score</span><span style={{fontWeight:800,color:'#fde68a'}}>+3 pts</span></div>
                <div style={{display:'flex',justifyContent:'space-between'}}><span>✅ Correct outcome</span><span style={{fontWeight:800,color:'#4ade80'}}>+2 pts</span></div>
                <div style={{display:'flex',justifyContent:'space-between'}}><span>❌ Wrong prediction</span><span style={{fontWeight:800,color:'rgba(255,255,255,0.4)'}}>+1 pt</span></div>
                <div style={{display:'flex',justifyContent:'space-between'}}><span>🚫 Didn't predict</span><span style={{fontWeight:800,color:'rgba(255,255,255,0.2)'}}>0 pts</span></div>
              </div>
            </div>
            {lb.find(e=>e.name===user.username&&e.pts>0)&&(
              <div style={{marginTop:10,textAlign:'center',fontSize:12,color:'rgba(255,255,255,0.2)'}}>Tap your row to celebrate 🎉</div>
            )}
          </>
        )}
      </div>
      <Nav/>
    </div>
  );
}
