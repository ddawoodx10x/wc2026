'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Nav } from '@/components/Nav';
import { USERS_LIST, calcPoints, fmtKickoff, isKickedOff } from '@/lib/fixtures-data';

interface Fx{id:string;match_number:number;stage:string;group?:string;home_team:string;away_team:string;home_flag:string;away_flag:string;kickoff_utc:string;status:string;home_score?:number;away_score?:number;}
interface Pred{id:string;fixture_id:string;home_score:number;away_score:number;points?:number;}

function confetti(){const c=['#f5c842','#1e7a42','#ef4444','#38bdf8','#f97316'];for(let i=0;i<40;i++){const p=document.createElement('div');p.className='confetti-p';p.style.cssText=`left:${Math.random()*100}%;width:${5+Math.random()*9}px;height:${5+Math.random()*9}px;background:${c[i%5]};border-radius:${i%2?'50%':'2px'};animation-delay:${Math.random()*0.5}s`;document.body.appendChild(p);setTimeout(()=>p.remove(),3200);}}
function celebrateExact(){const el=document.createElement('div');el.className='celebrate-big';el.style.cssText='font-size:82px;animation:exactBurst 0.55s cubic-bezier(.17,.67,.35,1.3) forwards';el.textContent='⭐';document.body.appendChild(el);setTimeout(()=>el.remove(),1500);confetti();}
function celebrateCorrect(){const el=document.createElement('div');el.className='celebrate-big';el.style.cssText='font-size:76px;animation:correctPop 0.42s ease-out forwards';el.textContent='👍';document.body.appendChild(el);setTimeout(()=>el.remove(),1200);const c=['#4ade80','#86efac','#22c55e','#bbf7d0'];for(let i=0;i<22;i++){const p=document.createElement('div');p.className='confetti-p';p.style.cssText=`left:${Math.random()*100}%;width:${4+Math.random()*7}px;height:${4+Math.random()*7}px;background:${c[i%4]};border-radius:${i%2?'50%':'2px'};animation-delay:${Math.random()*0.3}s`;document.body.appendChild(p);setTimeout(()=>p.remove(),2500);}}
function animateLock(){const el=document.createElement('div');el.className='lock-fly';el.textContent='🔒';document.body.appendChild(el);setTimeout(()=>el.remove(),800);}

function countdown(utc:string){
  const diff=new Date(utc).getTime()-Date.now();
  if(diff<=0)return null;
  const d=Math.floor(diff/86400000),h=Math.floor((diff%86400000)/3600000),m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);
  if(d>0)return`${d}d ${h}h`;if(h>0)return`${h}h ${m}m`;if(m>0)return`${m}m ${s}s`;return`${s}s`;
}

export default function PredictionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [fxs, setFxs] = useState<Fx[]>([]);
  const [preds, setPreds] = useState<Record<string,Pred>>({});
  const [allPreds, setAllPreds] = useState<any[]>([]);
  const [tab, setTab] = useState<'upcoming'|'picks'|'results'>('upcoming');
  const [drafts, setDrafts] = useState<Record<string,{h:string;a:string}>>({});
  const [saving, setSaving] = useState<string|null>(null);
  const [toast, setToast] = useState<{msg:string;type:string}|null>(null);
  const [, setTick] = useState(0);

  useEffect(() => { if (!user) router.replace('/login'); }, [user]);
  useEffect(() => { const t = setInterval(() => setTick(n=>n+1), 1000); return () => clearInterval(t); }, []);

  const showToast = (msg:string, type='ok') => { setToast({msg,type}); setTimeout(()=>setToast(null),2800); };

  const load = useCallback(async () => {
    if (!user) return;
    const [fxR, prR, allR] = await Promise.all([
      fetch('/api/fixtures'),
      fetch(`/api/predictions?userId=${user.id}`),
      fetch('/api/predictions'),
    ]);
    const [fxD, prD, allD] = await Promise.all([fxR.json(), prR.json(), allR.json()]);
    if (fxD.fixtures) setFxs(fxD.fixtures);
    if (prD.predictions) {
      const m: Record<string,Pred> = {};
      prD.predictions.forEach((p:any) => { m[p.fixture_id] = p; });
      setPreds(m);
    }
    if (allD.predictions) setAllPreds(allD.predictions);
  }, [user]);

  useEffect(() => { load(); }, [load]);
  // Reload every 30s to get latest scores
  useEffect(() => { const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

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

  if (!user) return null;

  const now = new Date();
  const upcomingFxs = fxs.filter(f => new Date(f.kickoff_utc) > now);
  const lockedFxs = fxs.filter(f => isKickedOff(f.kickoff_utc) && (f.home_score===null||f.home_score===undefined) && preds[f.id]);
  const resultFxs = fxs.filter(f => f.home_score!==null && f.home_score!==undefined);
  const display = tab==='upcoming'?upcomingFxs:tab==='picks'?lockedFxs:resultFxs;

  return (
    <div className="page">
      {toast && <div className={`toast ${toast.type==='ok'?'tok2':'terr'}`}>{toast.msg}</div>}
      <div className="shead">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <h2 style={{fontSize:20,fontWeight:900}}>🎯 Predictions</h2>
          <span style={{fontSize:12,color:'rgba(255,255,255,0.3)'}}>{Object.keys(preds).length}/{fxs.length} done</span>
        </div>
        <div style={{display:'flex',gap:7,paddingBottom:12}}>
          {([['upcoming','🕐 Upcoming',upcomingFxs.length],['picks','🔒 My Picks',lockedFxs.length],['results','📊 Results',resultFxs.length]] as const).map(([k,l,c])=>(
            <button key={k} className={`tab-btn${tab===k?' on':''}`} onClick={()=>{
              const prev=tab; setTab(k);
              if(k==='results'&&prev!=='results'){
                const hasEx=resultFxs.some(f=>{const p=preds[f.id];return p&&f.home_score!==null&&calcPoints(p.home_score,p.away_score,f.home_score!,f.away_score!)=== 3;});
                const hasOk=!hasEx&&resultFxs.some(f=>{const p=preds[f.id];return p&&f.home_score!==null&&calcPoints(p.home_score,p.away_score,f.home_score!,f.away_score!)===2;});
                if(hasEx)setTimeout(celebrateExact,400);else if(hasOk)setTimeout(celebrateCorrect,400);
              }
            }}>
              {l} {(c as number)>0&&<span style={{background:'rgba(255,255,255,0.13)',borderRadius:8,padding:'1px 5px',fontSize:10}}>{c}</span>}
            </button>
          ))}
        </div>
      </div>
      <div style={{padding:'10px 14px'}}>
        {display.length===0?(
          <div style={{textAlign:'center',padding:'60px 20px',color:'rgba(255,255,255,0.3)'}}>
            <div style={{fontSize:44,marginBottom:12}}>{tab==='upcoming'?'✅':tab==='picks'?'🔒':'📊'}</div>
            <p style={{fontSize:14}}>{tab==='upcoming'?'All caught up!':tab==='picks'?'No locked predictions yet':'No results yet'}</p>
          </div>
        ):display.map(f=>{
          const pred=preds[f.id];
          const sc=f.home_score!==null&&f.home_score!==undefined;
          const lk=isKickedOff(f.kickoff_utc);
          const pts=pred&&sc?calcPoints(pred.home_score,pred.away_score,f.home_score!,f.away_score!):null;
          const border=pts===3?'#fde68a':pts===2?'#4fc3f7':pts===1&&sc?'#f87171':lk?'#333':'#1e7a42';
          const badge=pts===3?<span className="tag tex">⚡ Exact +3</span>:pts===2?<span className="tag tok">✅ Correct +2</span>:pts===1&&sc?<span className="tag twrong">❌ +1</span>:!lk?<span style={{fontSize:11,color:'#4ade80',fontWeight:700}}>Open ✏️</span>:<span style={{fontSize:11,color:'#666'}}>🔒 Locked</span>;
          const cd=(!lk)?countdown(f.kickoff_utc):null;
          const cdUnder1h=cd&&!cd.includes('d')&&(!cd.includes('h')||cd.startsWith('0h'));

          // All users predictions for results tab
          const allForFx = tab==='results' ? allPreds.filter(p=>p.fixture_id===f.id) : [];

          return (
            <div key={f.id} className="mcard" style={{borderLeft:`3px solid ${border}`,marginBottom:11}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div style={{display:'flex',gap:5,alignItems:'center'}}>
                  {f.group?<span className="tag tg">Group {f.group}</span>:<span className="tag ts">{f.stage}</span>}
                  {cd&&<span className={`${cdUnder1h?'flash':''}`} style={{fontSize:11,fontWeight:700,color:cdUnder1h?'#fbbf24':'#4ade80'}}>⏱ {cd} · closes</span>}
                </div>
                {badge}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}><span style={{fontSize:26}}>{f.home_flag}</span><span style={{fontWeight:700,fontSize:12,textAlign:'center'}}>{f.home_team}</span></div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                  {sc&&<div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontWeight:700}}>FINAL: {f.home_score}–{f.away_score}</div>}
                  {lk?(pred?<div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:46,height:46,background:'rgba(255,255,255,0.07)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:900}}>{pred.home_score}</div>
                    <span style={{color:'rgba(255,255,255,0.3)',fontWeight:700}}>–</span>
                    <div style={{width:46,height:46,background:'rgba(255,255,255,0.07)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:900}}>{pred.away_score}</div>
                  </div>:<span style={{fontSize:12,color:'#666',fontStyle:'italic'}}>No pick</span>):(
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:7}}>
                      <div style={{display:'flex',alignItems:'center',gap:7}}>
                        <input type="number" min="0" max="20" className="score-box" value={drafts[f.id]?.h??(pred?String(pred.home_score):'')} placeholder={pred?String(pred.home_score):'0'} onChange={e=>setDrafts(p=>({...p,[f.id]:{...p[f.id],h:e.target.value}}))}/>
                        <span style={{color:'rgba(255,255,255,0.3)',fontWeight:700,fontSize:16}}>–</span>
                        <input type="number" min="0" max="20" className="score-box" value={drafts[f.id]?.a??(pred?String(pred.away_score):'')} placeholder={pred?String(pred.away_score):'0'} onChange={e=>setDrafts(p=>({...p,[f.id]:{...p[f.id],a:e.target.value}}))}/>
                      </div>
                      <button className="btn-g" style={{width:'auto',padding:'8px 20px',fontSize:13}} onClick={()=>savePred(f.id)} disabled={saving===f.id}>{saving===f.id?'Saving…':pred?'✏️ Update':'🎯 Predict'}</button>
                    </div>
                  )}
                </div>
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}><span style={{fontSize:26}}>{f.away_flag}</span><span style={{fontWeight:700,fontSize:12,textAlign:'center'}}>{f.away_team}</span></div>
              </div>
              {sc&&pts!==null&&<div style={{marginTop:9,textAlign:'center',fontSize:13,fontWeight:700,color:pts===3?'#fde68a':pts===2?'#4fc3f7':'#888'}}>{pts===3?'🎉 Exact score! +3 pts':pts===2?'👍 Correct outcome +2 pts':'😬 Wrong — +1 pt'}</div>}
              {tab==='results'&&allForFx.length>0&&(
                <div style={{marginTop:10,borderTop:'1px solid rgba(255,255,255,0.07)',paddingTop:10}}>
                  <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontWeight:700,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}}>The Lads Picks</div>
                  {USERS_LIST.map(ul=>{
                    const up=allForFx.find((p:any)=>p.user?.username===ul.name);
                    const pp=up?calcPoints(up.home_score,up.away_score,f.home_score!,f.away_score!):null;
                    const pc=pp===3?'#fde68a':pp===2?'#86efac':pp===1?'#f87171':'#666';
                    const isMe=ul.name===user.username;
                    return (
                      <div key={ul.name} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',borderRadius:8,background:isMe?'rgba(255,255,255,0.07)':'transparent'}}>
                        <span style={{fontSize:14}}>{ul.emoji}</span>
                        <span style={{fontSize:12,fontWeight:isMe?700:400,color:isMe?'white':'rgba(255,255,255,0.6)',flex:1}}>{ul.name}{isMe?' (you)':''}</span>
                        <span style={{fontSize:12,color:'rgba(255,255,255,0.5)'}}>{up?`${up.home_score}–${up.away_score}`:'No pick'}</span>
                        <span style={{fontSize:11,fontWeight:800,color:pc,minWidth:26,textAlign:'right'}}>{up?(pp!==null?`+${pp}`:'?'):'0'}</span>
                      </div>
                    );
                  })}
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
