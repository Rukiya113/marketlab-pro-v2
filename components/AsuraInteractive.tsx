'use client';
import {useState} from 'react';
import {useWorkstation} from './WorkstationProvider';
import DerivativesWorkspace from './DerivativesWorkspace';

const tabs=['OVERVIEW','CONTEXT','SETUP','EXECUTION','STRATEGIES','DERIVATIVES','SENTINEL'] as const;
type Tab=typeof tabs[number];

export default function AsuraInteractive(){
 const{instrumentId}=useWorkstation();const[tab,setTab]=useState<Tab>('OVERVIEW');
 return <section style={{border:'1px solid var(--border,#d9e3dd)',background:'var(--surface,#fff)'}}>
  <div style={{padding:10,fontWeight:800,fontSize:12}}>ASURA AGENT</div>
  <div style={{display:'flex',gap:4,overflowX:'auto',borderTop:'1px solid var(--border,#ddd)',borderBottom:'1px solid var(--border,#ddd)'}}>
   {tabs.map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:'9px 10px',border:0,background:'transparent',fontSize:9,fontWeight:tab===t?800:500,borderBottom:tab===t?'2px solid currentColor':'2px solid transparent'}}>{t}</button>)}
  </div>
  <div style={{padding:12,minHeight:240}}>
   {tab==='OVERVIEW'&&<Waiting title="WAITING FOR DATA" text="ASURA requires canonical 30m/15m context, 5m setup and 1m execution evidence."/>}
   {tab==='CONTEXT'&&<Waiting title="CONTEXT BRAIN" text="30m/15m structure, regime, volatility, location, liquidity context and contradictions will appear from canonical evidence."/>}
   {tab==='SETUP'&&<Waiting title="SETUP BRAIN" text="5m BOS/CHoCH, sweep, imbalance, displacement, pullback/retest quality and invalidation evidence."/>}
   {tab==='EXECUTION'&&<Waiting title="EXECUTION BRAIN" text="1m trigger, momentum, participation, anti-chase, signal age, stop and target evidence."/>}
   {tab==='STRATEGIES'&&<Waiting title="STRATEGY COMPETITION" text="Trend Pullback, Liquidity Sweep and Breakout-Retest scores remain unavailable until market evidence arrives."/>}
   {tab==='DERIVATIVES'&&<DerivativesWorkspace instrumentId={instrumentId}/>}
   {tab==='SENTINEL'&&<Waiting title="SENTINEL" text="Data quality, freshness, chase, spread, liquidity, option freshness, R:R, EV, cooldown and portfolio gates."/>}
  </div>
 </section>
}
function Waiting({title,text}:{title:string;text:string}){return <div><small>PRIMARY VIEW</small><h2 style={{fontSize:18}}>{title}</h2><p style={{fontSize:11,opacity:.65,maxWidth:420}}>{text}</p></div>}
