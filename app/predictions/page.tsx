'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Nav } from '@/components/Nav';
import { calcPoints, isKickedOff } from '@/lib/fixtures-data';

interface Fx{id:string;match_number:number;stage:string;group?:string;home_team:string;away_team:string;home_flag:string;away_flag:string;kickoff_utc:string;status:string;home_score?:number;away_score?:number;}
interface Pred{id:string;fixture_id:string;home_score:number;away_score:number;points?:number;is_locked?:boolean;}

function spawnConfetti(cols:string[],count=50){for(let i=0;i<count;i++){const p=document.createElement('div');const size=5+Math.random()*10;p.style.cssText=`position:fixed;top:-20px;left:${Math.random()*100}%;width:${size}px;height:${size}px;background:${cols[i%cols.length]};border-radius:${i%3?'50%':'3px'};pointer-events:none;z-index:9999;animation:wcFall ${2+Math.random()*1.5}s ease-in forwards;animation-delay:${Math.random()*0.6}s`;document.body.appendChild(p);setTimeout(()=>p.remove(),4000);}}

function celebrateExact(){const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;z-index:9998;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;pointer-events:none';const star=document.createElement('div');star.style.cssText='font-size:100px;animation:wcBurst 0.6s cubic-bezier(.17,.67,.35,1.3) forwards;filter:drop-shadow(0 0 30px rgba(245,200,66,0.9))';star.textContent='⭐';const msg=document.createElement('div');msg.style.cssText='font-size:22px;font-weight:900;color:#fde68a;text-align:center;padding:0 20px;animation:wcSlideUp 0.5s ease-out 0.3s both;text-shadow:0 0 20px rgba(245,200,66,0.8)';msg.textContent='EXACT SCORE! 🎯';const sub=document.createElement('div');sub.style.cssText='font-size:15px;color:rgba(255,255,255,0.8);animation:wcSlideUp 0.5s ease-out 0.5s both';sub.textContent='+3 points 🔥';overlay.appendChild(star);overlay.appendChild(msg);overlay.appendChild(sub);document.body.appendChild(overlay);setTimeout(()=>overlay.remove(),2500);spawnConfetti(['#f5c842','#fde68a','#f59e0b','#fff','#ff6b35','#34d399'],70);}

function celebrateCorrect(){const el=document.createElement('div');el.style.cssText='position:fixed;left:50%;top:35%;transform:translateX(-50%);z-index:9998;font-size:88px;pointer-events:none;animation:wcBurst 0.5s cubic-bezier(.17,.67,.35,1.3) forwards;filter:drop-shadow(0 0 20px rgba(34,197,94,0.8))';el.textContent='👍';document.body.appendChild(el);const banner=document.createElement('div');banner.style.cssText='position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:9999;background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;font-weight:900;font-size:16px;padding:14px 28px;border-radius:18px;white-space:nowrap;animation:wcSlideDown 0.4s ease-out forwards;pointer-events:none';banner.textContent='Correct outcome! +2 pts ✅';document.body.appendChild(banner);setTimeout(()=>{el.remove();banner.style.opacity='0';banner.style.transition='opacity 0.4s';setTimeout(()=>banner.remove(),400);},2000);spawnConfetti(['#4ade80','#86efac','#22c55e','#bbf7d0','#fff'],40);}

function animateLock(){const el=document.createElement('div');el.style.cssText='position:fixed;left:50%;top:40%;font-size:72px;z-index:9999;pointer-events:none;animation:wcLock 0.5s cubic-bezier(.17,.67,.35,1.3) forwards;transform:translateX(-50%)';el.textContent='🔒';document.body.appendChild(el);setTimeout(()=>el.remove(),800);}

function countdown(utc:string){const diff=new Date(utc).getTime()-Date.now();if(diff<=0)return null;const d=Math.floor(diff/86400000),h=Math.floor((diff%86400000)/3600000),m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);if(d>0)return`${d}d ${h}h`;if(h>0)return`${h}h ${m}m`;if(m>0)return`${m}m ${s}s`;return`${s}s`;}

export default function PredictionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAmmar = user?.username === 'Ammar';
  const [fxs, setFxs] = useState<Fx[]>([]);
  const [preds, setPreds] = useState<Record<string,Pred>>({});
  const [tab, setTab] = useState<'upcoming'|'picks'|'results'>('upcoming');
  const [drafts, setDrafts] = useState<Record<string,{h:string;a:string}>>({});
  const [saving, setSaving] = useState<string|null>(null);
  const [lockToggling, setLockToggling] = useState<string|null>(null);
  const [toast, setToast] = useState<{msg:string;type:string}|null>(null);
  const [, setTick] = useState(0);
  const celebratedFxIds = useRef<Set<string>>(new Set());

  useEffect(() => { if (!user) router.replace('/login'); }, [user]);
  useEffect(() => { const t = setInterval(() => setTick(n=>n+1), 1000); return () => clearInterval(t); }, []);

  const showToast = (msg:string, type='ok') => { setToast({msg,type}); setTimeout(()=>setToast(null),2800); };

  const load = useCallback(async () => {
    if (!user) return;
    const [fxR, prR] = await Promise.all([fetch('/api/fixtures'), fetch(`/api/predictions?userId=${user.id}`)]);
    const [fxD, prD] = await Promise.all([fxR.json(), prR.json()]);
    if (fxD.fixtures) setFxs(fxD.fixtures);
    if (prD.predictions) { const m: Record<string,Pred> = {}; prD.predictions.forEach((p:any) => { m[p.fixture_id] = p; }); setPreds(m); }
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  useEffect(() => {
    if (!user || tab !== 'results') return;
    const scored = fxs.filter(f => f.home_score !== null && f.home_score !== undefined);
    scored.forEach((f, idx) => {
      if (celebratedFxIds.current.has(f.id)) return;
      const pred = preds[f.id];
      if (!pred) return;
      celebratedFxIds.current.add(f.id);
      const pts = calcPoints(pred.home_score, pred.away_score, f.home_score!, f.away_score!);
      if (pts === 3) setTimeout(celebrateExact, idx * 200 + 400);
      else if (pts === 2) setTimeout(celebrateCorrect, idx * 200 + 400);
    });
  }, [fxs, preds, tab, user]);

  const switchTab = (t: 'upcoming'|'picks'|'results') => {
    const prev = tab; setTab(t);
    if (t === 'results' && prev !== 'results') celebratedFxIds.current.clear();
  };

  const savePred = async (fxId: string) => {
    const d = drafts[fxId];
    if (!d || d.h==='' || d.a==='') { showToast('Enter both scores','err'); return; }
    const hv=parseInt(d.h), av=parseInt(d.a);
    if(isNaN(hv)||isNaN(av)||hv<0||av<0){showToast('Invalid scores','err');return;}
    setSaving(fxId);
    const r = await fetch('/api/predictions', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({userId:user!.id,fixtureId:fxId,homeScore:hv,awayScore:av}) });
    const data = await r.json();
    setSaving(null);
    if (data.error) { showToast(data.error,'err'); return; }
    animateLock();
    setPreds(prev => ({...prev, [fxId]: data.prediction}));
    setDrafts(prev => { const n={...prev}; delete n[fxId]; return n; });
    showToast('Prediction saved! 🎯');
  };

  const toggleLock = async (fxId: string) => {
    if (!isAmmar || !user) return;
    const pred = preds[fxId];
    if (!pred) return;
    const newLocked = !pred.is_locked;
    setLockToggling(fxId);
    const r = await fetch('/api/predictions', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ userId: user.id, fixtureId: fxId, isLocked: newLocked, username: user.username }) });
    const data = await r.json();
    setLockToggling(null);
    if (data.error) { showToast(data.error, 'err'); return; }
    setPreds(prev => ({...prev, [fxId]: {...prev[fxId], is_locked: newLocked}}));
    if (newLocked) { animateLock(); showToast('Locked 🔒'); }
    else showToast('Unlocked — edit away ✏️');
  };

  if (!user) return null;

  const now = new Date();
  const upcomingFxs = fxs.filter(f => new Date(f.kickoff_utc) > now);
  const lockedFxs = fxs.filter(f => isKickedOff(f.kickoff_utc) && (f.home_score===null||f.home_score===undefined) && preds[f.id]);
  const resultFxs = fxs.filter(f => f.home_score!==null && f.home_score!==undefined);
  const display = tab==='upcoming'?upcomingFxs:tab==='picks'?lockedFxs:resultFxs;
  const myTotalPts = resultFxs.reduce((sum,f) => { const p=preds[f.id]; if(!p)return sum; return sum+calcPoints(p.home_score,p.away_score,f.home_score!,f.away_score!); }, 0);

  return (
    <div className="page">
      <style>{`
        @keyframes wcFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}
        @keyframes wcBurst{0%{transform:translateX(-50%) scale(0.2);opacity:0}60%{transform:translateX(-50%) scale(1.25);opacity:1}100%{transform:translateX(-50%) scale(1);opacity:1}}
        @keyframes wcSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes wcSlideDown{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes wcLock{0%{opacity:0;transform:translateX(-50%) scale(1.8) rotate(-15deg)}60%{transform:translateX(-50%) scale(0.9) rotate(5deg)}100%{opacity:1;transform:translateX(-50%) scale(1) rotate(0deg)}}
        @keyframes predFlash{0%,100%{opacity:1}50%{opacity:0.25}}
        .flash{animation:predFlash 1.2s ease-in-out infinite}
      `}</style>

      {toast && <div style={{position:'fixed',top:22,left:'50%',transform:'translateX(-50%)',zIndex:9999,padding:'12px 22px',borderRadius:14,fontWeight:700,fontSize:13,whiteSpace:'nowrap',color:'#fff',boxShadow:'0 6px 24px rgba(0,0,0,0.5)',background:toast.type==='ok'?'rgba(21,128,61,0.97)':'rgba(185,28,28,0.97)'}}>{toast.msg}</div>}

      <div className="shead">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <h2 style={{fontSize:20,fontWeight:900}}>🎯 Predictions</h2>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {myTotalPts > 0 && <span style={{fontSize:13,fontWeight:800,color:'#fde68a'}}>⚡ {myTotalPts} pts</span>}
            <span style={{fontSize:12,color:'rgba(255,255,255,0.3)'}}>{Object.keys(preds).length}/{fxs.length}</span>
          </div>
        </div>
        <div style={{display:'flex',gap:7,paddingBottom:12}}>
          {([['upcoming','🕐 Upcoming',upcomingFxs.length],['picks','🔒 My Picks',lockedFxs.length],['results','📊 Results',resultFxs.length]] as const).map(([k,l,c])=>(
            <button key={k} className={`tab-btn${tab===k?' on':''}`} onClick={()=>switchTab(k)}>
              {l} {(c as number)>0&&<span style={{background:'rgba(255,255,255,0.13)',borderRadius:8,padding:'1px 5px',fontSize:10}}>{c}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:'10px 14px'}}>
        {display.length===0?(
          <div style={{textAlign:'center',padding:'60px 20px',color:'rgba(255,255,255,0.3)'}}>
            <div style={{fontSize:44,marginBottom:12}}>{tab==='upcoming'?'✅':tab==='picks'?'🔒':'📊'}</div>
            <p style={{fontSize:14}}>{tab==='upcoming'?'All caught up!':tab==='picks'?'No locked predictions yet':'No results yet — matches coming!'}</p>
          </div>
        ):display.map(f=>{
          const pred=preds[f.id];
          const sc=f.home_score!==null&&f.home_score!==undefined;
          const lk=isKickedOff(f.kickoff_utc);
          const pts=pred&&sc?calcPoints(pred.home_score,pred.away_score,f.home_score!,f.away_score!):null;
          const border=pts===3?'#fde68a':pts===2?'#4ade80':pts===1&&sc?'rgba(255,255,255,0.15)':lk?'#333':'#1e7a42';
          const cd=!lk?countdown(f.kickoff_utc):null;
          const under1h=cd&&!cd.includes('d')&&(!cd.includes('h')||cd.startsWith('0h'));
          const hasFinalScore = sc;
          const ammarUnlocked = isAmmar && tab==='picks' && pred && pred.is_locked === false && !hasFinalScore;
          const lockedBadge = isAmmar && tab==='picks' && pred && !hasFinalScore
            ? <button onClick={()=>toggleLock(f.id)} disabled={lockToggling===f.id} style={{fontSize:11,fontWeight:700,color:ammarUnlocked?'#4ade80':'#f5c842',background:'none',border:'none',cursor:'pointer',padding:0}}>{lockToggling===f.id?'…':ammarUnlocked?'🔓 Unlocked':'🔒 Locked'}</button>
            : <span style={{fontSize:11,color:'#555'}}>🔒 Locked</span>;
          const badge=pts===3?<span className="tag tex">⚡ Exact +3</span>:pts===2?<span className="tag tok">✅ +2</span>:pts===1&&sc?<span className="tag twrong">❌ +1</span>:!lk?<span style={{fontSize:11,color:'#4ade80',fontWeight:700}}>Open ✏️</span>:lockedBadge;
          return (
            <div key={f.id} style={{background:'rgba(255,255,255,0.045)',border:'1px solid rgba(255,255,255,0.08)',borderLeft:`3px solid ${border}`,borderRadius:16,padding:'14px 16px',marginBottom:11}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div style={{display:'flex',gap:5,alignItems:'center'}}>
                  {f.group?<span className="tag tg">Group {f.group}</span>:<span className="tag ts">{f.stage}</span>}
                  {cd&&<span className={under1h?'flash':''} style={{fontSize:11,fontWeight:700,color:under1h?'#fbbf24':'#4ade80'}}>⏱ {cd} · closes</span>}
                </div>
                {badge}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                  <span style={{fontSize:26}}>{f.home_flag}</span>
                  <span style={{fontWeight:700,fontSize:12,textAlign:'center'}}>{f.home_team}</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,minWidth:110}}>
                  {sc&&<div style={{fontSize:11,color:'rgba(255,255,255,0.35)',fontWeight:700}}>FINAL: {f.home_score}–{f.away_score}</div>}
                  {ammarUnlocked?(
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:7}}>
                      <div style={{display:'flex',alignItems:'center',gap:7}}>
                        <input type="number" min="0" max="20" className="score-box" value={drafts[f.id]?.h??(pred?String(pred.home_score):'')} placeholder="0" onChange={e=>setDrafts(p=>({...p,[f.id]:{...p[f.id],h:e.target.value}}))} onKeyDown={e=>e.key==='Enter'&&savePred(f.id)}/>
                        <span style={{color:'rgba(255,255,255,0.3)',fontWeight:700,fontSize:18}}>–</span>
                        <input type="number" min="0" max="20" className="score-box" value={drafts[f.id]?.a??(pred?String(pred.away_score):'')} placeholder="0" onChange={e=>setDrafts(p=>({...p,[f.id]:{...p[f.id],a:e.target.value}}))} onKeyDown={e=>e.key==='Enter'&&savePred(f.id)}/>
                      </div>
                      <button className="btn-g" style={{width:'auto',padding:'8px 20px',fontSize:13}} onClick={()=>savePred(f.id)} disabled={saving===f.id}>{saving===f.id?'Saving…':'✏️ Update'}</button>
                    </div>
                  ):lk?(pred?
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:46,height:46,background:pts===3?'rgba(245,200,66,0.15)':pts===2?'rgba(34,197,94,0.12)':'rgba(255,255,255,0.07)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:900,border:`2px solid ${pts===3?'rgba(245,200,66,0.3)':pts===2?'rgba(34,197,94,0.25)':'rgba(255,255,255,0.08)'}`}}>{pred.home_score}</div>
                      <span style={{color:'rgba(255,255,255,0.3)',fontWeight:700}}>–</span>
                      <div style={{width:46,height:46,background:pts===3?'rgba(245,200,66,0.15)':pts===2?'rgba(34,197,94,0.12)':'rgba(255,255,255,0.07)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:900,border:`2px solid ${pts===3?'rgba(245,200,66,0.3)':pts===2?'rgba(34,197,94,0.25)':'rgba(255,255,255,0.08)'}`}}>{pred.away_score}</div>
                    </div>
                  :<span style={{fontSize:12,color:'#555',fontStyle:'italic'}}>No pick</span>):(
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:7}}>
                      <div style={{display:'flex',alignItems:'center',gap:7}}>
                        <input type="number" min="0" max="20" className="score-box" value={drafts[f.id]?.h??(pred?String(pred.home_score):'')} placeholder="0" onChange={e=>setDrafts(p=>({...p,[f.id]:{...p[f.id],h:e.target.value}}))} onKeyDown={e=>e.key==='Enter'&&savePred(f.id)}/>
                        <span style={{color:'rgba(255,255,255,0.3)',fontWeight:700,fontSize:18}}>–</span>
                        <input type="number" min="0" max="20" className="score-box" value={drafts[f.id]?.a??(pred?String(pred.away_score):'')} placeholder="0" onChange={e=>setDrafts(p=>({...p,[f.id]:{...p[f.id],a:e.target.value}}))} onKeyDown={e=>e.key==='Enter'&&savePred(f.id)}/>
                      </div>
                      <button className="btn-g" style={{width:'auto',padding:'8px 20px',fontSize:13}} onClick={()=>savePred(f.id)} disabled={saving===f.id}>{saving===f.id?'Saving…':pred?'✏️ Update':'🎯 Predict'}</button>
                    </div>
                  )}
                </div>
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                  <span style={{fontSize:26}}>{f.away_flag}</span>
                  <span style={{fontWeight:700,fontSize:12,textAlign:'center'}}>{f.away_team}</span>
                </div>
              </div>
              {sc&&pts!==null&&(
                <div style={{marginTop:10,textAlign:'center',padding:'8px 12px',borderRadius:10,background:pts===3?'rgba(245,200,66,0.1)':pts===2?'rgba(34,197,94,0.08)':'rgba(255,255,255,0.04)',border:`1px solid ${pts===3?'rgba(245,200,66,0.2)':pts===2?'rgba(34,197,94,0.15)':'rgba(255,255,255,0.06)'}`}}>
                  <span style={{fontSize:14,fontWeight:800,color:pts===3?'#fde68a':pts===2?'#4ade80':'rgba(255,255,255,0.4)'}}>
                    {pts===3?'🎉 Exact score! +3 pts':pts===2?'👍 Correct outcome! +2 pts':'😬 Wrong prediction +1 pt'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Nav/>
    </div>
  );
}
