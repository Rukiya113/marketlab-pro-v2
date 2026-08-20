'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Bot, ShieldCheck, Waves } from './Icons';
import { useIntelligence, useMarketStream } from './hooks';
import { useWorkstation } from './WorkstationProvider';
import AsuraDecisionPanel from './AsuraDecisionPanel';
import DerivativesWorkspace from './DerivativesWorkspace';
const TABS=['OVERVIEW','CONTEXT','SETUP','EXECUTION','STRATEGIES','DERIVATIVES','SENTINEL'] as const;
type Tab=typeof TABS[number];
export default function AsuraCompact(){
 const{instrumentId}=useWorkstation();const{ticks}=useMarketStream();const state=useIntelligence(instrumentId);const[tab,setTab]=useState<Tab>('OVERVIEW');
 const feedLive=Boolean(ticks[instrumentId]);const d=state.decision;
 return <aside className="asuraRight"><div className="asuraHeader"><b>ASURA AGENT</b><span className={d?.state==='READY'?'live':feedLive?'warnPill':'offline'}>● {d?.state==='READY'?'READY':feedLive?'ANALYZING':'WAITING'}</span></div>
 <div className="asuraTabs">{TABS.map(t=><button key={t} onClick={()=>setTab(t)} className={tab===t?'active':''}>{t}</button>)}</div>
 {tab==='OVERVIEW'&&<><section className="asuraThesis"><small>PRIMARY THESIS</small><div className="thesisRow"><div><h2>{d?.direction??'WAITING FOR DATA'}</h2><p>{d?.summary??'Connect the canonical feed to build 30m/15m context, 5m setup and 1m execution evidence.'}</p></div><Bot size={54}/></div></section><AsuraDecisionPanel decision={d}/></>}
 {tab==='CONTEXT'&&<Brain title="CONTEXT BRAIN" summary={d?.context.summary} rows={[['Direction',d?.context.direction],['Probability',d?`${d.context.probability}%`:null],['Regime',d?.context.regime.regime],['Location',d?.context.locationQuality],['Contradiction',d?.context.contradictionScore]]}/>} 
 {tab==='SETUP'&&<Brain title="SETUP BRAIN" summary={d?.setup.summary} rows={[['Direction',d?.setup.direction],['Setup quality',d?.setup.setupQuality],['Location',d?.setup.locationQuality],['Displacement',d?.setup.displacementQuality],['Pullback',d?.setup.pullbackQuality],['Breakout retest',d?.setup.breakoutRetestQuality],['Sweep reversal',d?.setup.sweepReversalQuality]]}/>} 
 {tab==='EXECUTION'&&<Brain title="EXECUTION BRAIN" summary={d?.execution.summary} rows={[['Direction',d?.execution.direction],['Execution quality',d?.execution.executionQuality],['Trigger',d?.execution.triggerQuality],['Momentum',d?.execution.momentumQuality],['Participation',d?.execution.participationQuality],['Anti-chase',d?.execution.antiChaseQuality],['Signal age',d?.execution.signalAgeMs==null?null:`${d.execution.signalAgeMs} ms`]]}/>} 
 {tab==='STRATEGIES'&&<section className="asuraTwin"><section style={{gridColumn:'1 / -1'}}><h4>STRATEGY COMPETITION</h4>{d?.competition.evaluations.length?d.competition.evaluations.map(x=><p key={x.id}><span>{x.label}</span><b>{x.score} · {x.eligible?'ELIGIBLE':'BLOCKED'}</b></p>):<p><span>Waiting for strategy evidence</span><b>—</b></p>}</section></section>}
 {tab==='DERIVATIVES'&&<div style={{padding:8}}><DerivativesWorkspace instrumentId={instrumentId}/></div>}
 {tab==='SENTINEL'&&<section className="asuraTwin"><section style={{gridColumn:'1 / -1'}}><h4>SENTINEL GATES</h4>{state.sentinel?.checks.length?state.sentinel.checks.map(x=><p key={x.id}><span>{x.label}</span><b className={x.result==='PASS'?'live':x.result==='FAIL'?'offline':''}>{x.result}</b></p>):<p><span>Waiting for execution intent</span><b>BLOCKED</b></p>}</section></section>}
 <section className="pulseCard"><h4>ASURA PULSE SYSTEM</h4><div><Waves size={38}/><p><small>FEED</small><b className={feedLive?'live':'offline'}>{feedLive?'LIVE':'OFFLINE'}</b></p><p><ShieldCheck size={18}/><small>SENTINEL</small><b>{state.sentinel?.decision??'BLOCKED'}</b></p><p><small>PORTFOLIO</small><b>{state.portfolio?.allowed?'ALLOWED':'BLOCKED'}</b></p></div></section><Link href="/asura-agent" className="fullAsura">OPEN FULL ASURA AGENT →</Link></aside>
}
function Brain({title,summary,rows}:{title:string;summary?:string;rows:[string,string|number|null|undefined][]}){return <><section className="asuraThesis"><small>{title}</small><div className="thesisRow"><div><h2>{summary?'EVIDENCE':'WAITING FOR DATA'}</h2><p>{summary??'Canonical multi-timeframe evidence has not arrived yet.'}</p></div></div></section><section className="asuraTwin"><section style={{gridColumn:'1 / -1'}}><h4>{title}</h4>{rows.map(([k,v])=><p key={k}><span>{k}</span><b>{v??'—'}</b></p>)}</section></section></>}
