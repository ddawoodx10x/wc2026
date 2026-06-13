'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Nav } from '@/components/Nav';
import { isKickedOff } from '@/lib/fixtures-data';

interface Fx{id:string;match_number:number;stage:string;group?:string;home_team:string;away_team:string;home_flag:string;away_flag:string;kickoff_utc:string;status:string;home_score?:number;away_score?:number;}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [fxs, setFxs] = useState<Fx[]>([]);
  const [tab, setTab] = useState<'scores'|'picks'>('scores');
  const [scores, setScores] = useState<Record<string,{h:string;a:string}>>({});
  const [allPreds, setAllPreds] = useState<any[]>([]);
  const [toast, setToast] = useState<{msg:string;type:string}|null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => { if (!user) { router.replace('/login'); return; } if (!user.is_admin) router.replace('/fixtures'); }, [user]);

  const showToast = (msg:string,type='ok') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const load = useCallback(async () => {
    if (!user) return;
    const [fxR, prR] = await Promise.all([fetch('/api/fixtures'), fetch(`/api/admin/predictions?userId=${user.id}`)]);
    const [fxD, prD] = await Promise.all([fxR.json(), prR.json()]);
    if (fxD.fixtures) { setFxs(fxD.fixtures); setSeeded(fxD.fixtures.length > 0); }
    if (prD.predictions) setAllPreds(prD.predictions);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const seed = async () => {
    setSeeding(true);
    const r = await fetch('/api/fixtures/seed', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ key: 'ammar2026' }) });
    const d = await r.json();
    setSeeding(false);
    if (d.error) showToast('Error: '+d.error,'err');
    else { showToast(`✅ ${d.seeded} fixtures loaded!`); load(); }
  };

  const saveScore = async (fxId: string) => {
    const s = scores[fxId];
    if (!s||s.h===''||s.a==='') { showToast('Enter both scores','err'); return; }
    const hv=parseInt(s.h), av=parseInt(s.a);
    if(isNaN(hv)||isNaN(av)||hv<0||av<0){showToast('Invalid scores','err');return;}
    const r = await fetch('/api/admin/score', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({userId:user!.id,fixtureId:fxId,homeScore:hv,awayScore:av}) });
    const d = await r.json();
    if (d.error) showToast(d.error,'err');
    else { showToast(`⚽ ${hv}–${av} saved! ${d.updated} predictions updated`); load(); }
  };

  if (!user?.is_admin) return null;
  const pastFxs = fxs.filter(f => isKickedOff(f.kickoff_utc));

  return (
    <div className="page">
      {toast&&<div className={`toast ${toast.type==='ok'?'tok2':'terr'}`}>{toast.msg}</div>}
      <div className="shead">
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
          <h2 style={{fontSize:20,fontWeight:900}}>⚙️ Admin</h2>
          <span style={{marginLeft:'auto',fontSize:11,background:'rgba(245,200,66,0.15)',border:'1px solid rgba(245,200,66,0.28)',color:'#fde68a',padding:'3px 10px',borderRadius:20,fontWeight:700}}>👑 {user.username}</span>
        </div>
        <div style={{display:'flex',gap:7,paddingBottom:12}}>
          <button className={`tab-btn${tab==='scores'?' on':''}`} onClick={()=>setTab('scores')}>⚽ Enter Scores</button>
          <button className={`tab-btn${tab==='picks'?' on':''}`} onClick={()=>setTab('picks')}>👁 All Picks</button>
        </div>
      </div>
      <div style={{padding:'10px 14px'}}>
        {!seeded&&(
          <div style={{background:'rgba(245,200,66,0.08)',border:'1px solid rgba(245,200,66,0.2)',borderRadius:14,padding:16,marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,color:'#fde68a',marginBottom:6}}>⚠️ Fixtures not loaded yet</div>
            <button className="btn-gold" onClick={seed} disabled={seeding}>{seeding?'Loading...':'🚀 Load All 104 WC2026 Fixtures'}</button>
          </div>
        )}
        {tab==='scores'&&(
          <>
            <div style={{background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:12,padding:'10px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:10}}>
              <div style={{fontSize:13,fontWeight:700,color:'#4ade80',flex:1}}>👑 Enter score → all friends' points update instantly</div>
            </div>
            {pastFxs.length===0?(
              <div style={{textAlign:'center',padding:'50px',color:'rgba(255,255,255,0.3)'}}>
                <div style={{fontSize:40,marginBottom:8}}>⏳</div><p>No matches started yet</p>
              </div>
            ):pastFxs.map(f=>(
              <div key={f.id} className="mcard" style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                  <span style={{fontSize:11,color:'rgba(255,255,255,0.35)'}}>#{f.match_number} · {f.group?`Group ${f.group}`:f.stage}</span>
                  {f.home_score!==null&&f.home_score!==undefined&&<span style={{fontSize:11,color:'#4ade80',fontWeight:700}}>✅ FT: {f.home_score}–{f.away_score}</span>}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                  <span style={{fontSize:17}}>{f.home_flag}</span><span style={{fontWeight:700,flex:1,fontSize:12}}>{f.home_team}</span>
                  <span style={{color:'rgba(255,255,255,0.2)',fontWeight:700}}>vs</span>
                  <span style={{fontWeight:700,flex:1,textAlign:'right',fontSize:12}}>{f.away_team}</span><span style={{fontSize:17}}>{f.away_flag}</span>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <input type="number" min="0" className="score-box" style={{width:56}} placeholder={f.home_score!==null&&f.home_score!==undefined?String(f.home_score):'0'} value={scores[f.id]?.h??(f.home_score!==null&&f.home_score!==undefined?String(f.home_score):'')} onChange={e=>setScores(p=>({...p,[f.id]:{...p[f.id],h:e.target.value}}))}/>
                  <span style={{color:'rgba(255,255,255,0.3)',fontWeight:900}}>–</span>
                  <input type="number" min="0" className="score-box" style={{width:56}} placeholder={f.away_score!==null&&f.away_score!==undefined?String(f.away_score):'0'} value={scores[f.id]?.a??(f.away_score!==null&&f.away_score!==undefined?String(f.away_score):'')} onChange={e=>setScores(p=>({...p,[f.id]:{...p[f.id],a:e.target.value}}))}/>
                  <button className="btn-g" style={{flex:1,padding:'9px 10px',fontSize:13}} onClick={()=>saveScore(f.id)}>{f.home_score!==null&&f.home_score!==undefined?'Saved ✅':'Save ✅'}</button>
                </div>
              </div>
            ))}
          </>
        )}
        {tab==='picks'&&(
          <>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:12}}>{allPreds.length} total predictions</div>
            {fxs.filter(f=>allPreds.some(p=>p.fixture_id===f.id)).map(f=>{
              const fp=allPreds.filter(p=>p.fixture_id===f.id);
              const sc=f.home_score!==null&&f.home_score!==undefined;
              return (
                <div key={f.id} style={{marginBottom:14}}>
                  <div style={{fontWeight:700,fontSize:12,color:'rgba(255,255,255,0.5)',marginBottom:5}}>
                    #{f.match_number} {f.home_flag} {f.home_team} vs {f.away_team} {f.away_flag}
                    {sc&&<span style={{color:'#fde68a',marginLeft:7}}>({f.home_score}–{f.away_score})</span>}
                  </div>
                  {fp.map((p:any)=>(
                    <div key={p.id} style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.04)',borderRadius:9,padding:'8px 10px',fontSize:12,marginBottom:3}}>
                      <span style={{fontWeight:700,width:80}}>{p.user?.username}</span>
                      <span style={{fontWeight:700}}>{p.home_score}–{p.away_score}</span>
                      {p.points!==null&&p.points!==undefined&&<span style={{marginLeft:'auto',fontWeight:700,color:p.points===3?'#fde68a':p.points===2?'#86efac':'#888'}}>+{p.points}pt{p.points!==1?'s':''}</span>}
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        )}
      </div>
      <Nav/>
    </div>
  );
}
