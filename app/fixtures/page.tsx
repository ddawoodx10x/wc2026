'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Nav } from '@/components/Nav';
import { fmtKickoff, isKickedOff } from '@/lib/fixtures-data';

interface Fx { id:string;match_number:number;stage:string;group?:string;home_team:string;away_team:string;home_flag:string;away_flag:string;kickoff_utc:string;venue:string;city:string;status:string;home_score?:number;away_score?:number; }

function countdown(utc:string) {
  const diff = new Date(utc).getTime() - Date.now();
  if (diff <= 0) return null;
  const d=Math.floor(diff/86400000),h=Math.floor((diff%86400000)/3600000),m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);
  if(d>0) return `${d}d ${h}h`;
  if(h>0) return `${h}h ${m}m`;
  if(m>0) return `${m}m ${s}s`;
  return `${s}s`;
}

function calcGroupStandings(group: string, fixtures: Fx[]) {
  const gfx = fixtures.filter(f => f.group === group);
  const teams: Record<string,any> = {};
  gfx.forEach(f => {
    if (!teams[f.home_team]) teams[f.home_team]={name:f.home_team,flag:f.home_flag,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0};
    if (!teams[f.away_team]) teams[f.away_team]={name:f.away_team,flag:f.away_flag,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0};
  });
  gfx.forEach(f => {
    if (f.home_score === undefined || f.home_score === null) return;
    const h=teams[f.home_team],a=teams[f.away_team];
    h.p++;a.p++;h.gf+=f.home_score!;h.ga+=f.away_score!;a.gf+=f.away_score!;a.ga+=f.home_score!;
    if(f.home_score!>f.away_score!){h.w++;h.pts+=3;a.l++;}
    else if(f.home_score!<f.away_score!){a.w++;a.pts+=3;h.l++;}
    else{h.d++;h.pts++;a.d++;a.pts++;}
  });
  return Object.values(teams).sort((a:any,b:any)=>{
    if(b.pts!==a.pts)return b.pts-a.pts;
    const gdB=b.gf-b.ga,gdA=a.gf-a.ga;
    if(gdB!==gdA)return gdB-gdA;
    return b.gf-a.gf;
  });
}

const STAGES = ['All','Group Stage','Round of 32','Round of 16','Quarter-Final','Semi-Final','Third Place','Final'];
const GROUPS = ['All','A','B','C','D','E','F','G','H','I','J','K','L'];
const stageLabel = (s:string) => ({All:'All','Group Stage':'🔵 Groups','Round of 32':'⚡ R32','Round of 16':'🔥 R16','Quarter-Final':'💥 QF','Semi-Final':'🌟 SF','Third Place':'🥉 3rd',Final:'🏆 Final'}[s]||s);

export default function FixturesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [fxs, setFxs] = useState<Fx[]>([]);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState('All');
  const [grp, setGrp] = useState('All');
  const [, setTick] = useState(0);

  useEffect(() => { if (!user) router.replace('/login'); }, [user]);

  const load = useCallback(async () => {
    const r = await fetch('/api/fixtures');
    const d = await r.json();
    if (d.fixtures) setFxs(d.fixtures);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(() => setTick(n=>n+1), 1000); return () => clearInterval(t); }, []);

  if (!user) return null;

  const filtered = fxs.filter(f => {
    if (stage !== 'All' && f.stage !== stage) return false;
    if (stage === 'Group Stage' && grp !== 'All' && f.group !== grp) return false;
    return true;
  });

  const byDate: Record<string,Fx[]> = {};
  filtered.forEach(f => {
    const d = new Date(f.kickoff_utc).toLocaleDateString('en-GB',{timeZone:'Asia/Riyadh',weekday:'long',month:'long',day:'numeric'});
    if (!byDate[d]) byDate[d]=[];
    byDate[d].push(f);
  });

  const groups = stage==='Group Stage' ? (grp==='All'?GROUPS.slice(1):[grp]) : [];

  return (
    <div className="page">
      <div className="shead">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
          <h2 style={{fontSize:20,fontWeight:900}}>⚽ Fixtures</h2>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:12,color:'rgba(255,255,255,0.3)'}}>{fxs.length} matches</span>
            {user.is_admin && <button onClick={()=>router.push('/admin')} style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:18}}>⚙️</button>}
          </div>
        </div>
        <div className="scroll-x">
          {STAGES.map(s=><button key={s} className={`pill${stage===s?' on':''}`} onClick={()=>{setStage(s);setGrp('All')}}>{stageLabel(s)}</button>)}
        </div>
        {stage==='Group Stage' && (
          <div className="scroll-x">
            {GROUPS.map(g=><button key={g} className={`pill${grp===g?' on':''}`} onClick={()=>setGrp(g)} style={grp===g?{}:{background:'rgba(139,92,246,0.1)',color:'rgba(196,181,253,0.6)'}}>{g==='All'?'All Groups':`Grp ${g}`}</button>)}
          </div>
        )}
      </div>
      <div style={{padding:'10px 14px'}}>
        {loading ? [1,2,3,4].map(i=><div key={i} className="shimmer"/>) : (
          <>
            {groups.map(g => {
              const rows = calcGroupStandings(g, fxs);
              const qc = ['rgba(34,197,94,0.18)','rgba(34,197,94,0.18)','rgba(59,130,246,0.15)','transparent'];
              return (
                <div key={g} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,marginBottom:14,overflow:'hidden'}}>
                  <div style={{padding:'10px 12px',background:'linear-gradient(135deg,rgba(139,92,246,0.25),rgba(109,40,217,0.15))',borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:13,fontWeight:900,color:'#e9d5ff',letterSpacing:.5}}>GROUP {g}</span>
                    <span style={{fontSize:10,color:'rgba(255,255,255,0.3)',marginLeft:'auto'}}>P  W  D  L  GD  Pts</span>
                  </div>
                  {rows.map((t:any,i:number)=>{
                    const gd=t.gf-t.ga;
                    const rc=i===0?'#fde68a':i===1?'#86efac':'rgba(255,255,255,0.35)';
                    return <div key={t.name} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 12px',background:qc[i],borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                      <span style={{fontSize:12,fontWeight:900,color:rc,width:16,textAlign:'center'}}>{i+1}</span>
                      <span style={{fontSize:18}}>{t.flag}</span>
                      <span style={{flex:1,fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.92)'}}>{t.name}</span>
                      {[t.p,t.w,t.d,t.l].map((v:number,j:number)=><span key={j} style={{fontSize:11,color:'rgba(255,255,255,0.45)',width:16,textAlign:'center'}}>{v}</span>)}
                      <span style={{fontSize:11,color:'rgba(255,255,255,0.5)',width:24,textAlign:'center',fontWeight:600}}>{gd>0?'+'+gd:gd}</span>
                      <span style={{fontSize:13,fontWeight:900,color:i<2?'#fde68a':'white',width:22,textAlign:'right'}}>{t.pts}</span>
                    </div>;
                  })}
                  <div style={{padding:'4px 12px 6px',display:'flex',gap:12}}>
                    <span style={{fontSize:9,color:'rgba(34,197,94,0.7)'}}>■ Qualify</span>
                    <span style={{fontSize:9,color:'rgba(59,130,246,0.7)'}}>■ 3rd place contender</span>
                  </div>
                </div>
              );
            })}
            {Object.entries(byDate).map(([date,dayFxs])=>(
              <div key={date}>
                <div className="dlbl">{date}</div>
                {dayFxs.map(f=>{
                  const sc = f.home_score!==null&&f.home_score!==undefined;
                  const kicked = isKickedOff(f.kickoff_utc);
                  const live = kicked && !sc && (Date.now()-new Date(f.kickoff_utc).getTime())<9000000;
                  const ended = kicked && !sc && !live;
                  const cd = !kicked ? countdown(f.kickoff_utc) : null;
                  const border = sc?'rgba(255,255,255,0.1)':live?'#ef4444':ended?'rgba(248,113,113,0.3)':'#1e7a42';
                  return <div key={f.id} className="mcard" style={{borderLeft:`3px solid ${border}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:9}}>
                      <div style={{display:'flex',gap:5}}>
                        {f.group?<span className="tag tg">Group {f.group}</span>:<span className="tag ts">{f.stage}</span>}
                      </div>
                      {sc?<span className="tag tft">FT</span>:live?<span className="tag tlive">● Live</span>:ended?<span className="tag tft" style={{color:'#f87171',borderColor:'rgba(248,113,113,0.3)'}}>Ended</span>:(
                        <div style={{textAlign:'right',lineHeight:1.3}}>
                          <div style={{fontSize:10,color:'rgba(255,255,255,0.35)'}}>{fmtKickoff(f.kickoff_utc)}</div>
                          {cd&&<div style={{fontSize:11,fontWeight:800,color:cd.includes('d')?'#4ade80':cd.includes('h')?'#fbbf24':'#f87171'}}>⏱ {cd}</div>}
                        </div>
                      )}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{flex:1,display:'flex',alignItems:'center',gap:7}}><span style={{fontSize:22}}>{f.home_flag}</span><span style={{fontWeight:700,fontSize:13}}>{f.home_team}</span></div>
                      <div style={{minWidth:58,textAlign:'center'}}>
                        {sc?<span style={{fontSize:20,fontWeight:900,color:'#fde68a'}}>{f.home_score} – {f.away_score}</span>:<span style={{fontSize:12,color:'rgba(255,255,255,0.22)',fontWeight:700}}>VS</span>}
                      </div>
                      <div style={{flex:1,display:'flex',alignItems:'center',gap:7,justifyContent:'flex-end'}}><span style={{fontWeight:700,fontSize:13}}>{f.away_team}</span><span style={{fontSize:22}}>{f.away_flag}</span></div>
                    </div>
                    <div style={{marginTop:7,fontSize:10,color:'rgba(255,255,255,0.22)',display:'flex',gap:3,alignItems:'center'}}>
                      <span>📍</span><span>{f.venue}, {f.city}</span><span style={{marginLeft:'auto',opacity:.6}}>#{f.match_number}</span>
                    </div>
                  </div>;
                })}
              </div>
            ))}
          </>
        )}
      </div>
      <Nav/>
    </div>
  );
}
