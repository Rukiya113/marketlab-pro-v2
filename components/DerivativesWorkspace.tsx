'use client';
import {useEffect,useMemo,useState} from 'react';
import type {CanonicalInstrumentId} from '@/lib/market/events';
import type {DerivativeSegment,DerivativeUniverse} from '@/lib/derivatives/types';
import styles from './DerivativesWorkspace.module.css';

export default function DerivativesWorkspace({instrumentId}:{instrumentId:CanonicalInstrumentId}){
 const[universe,setUniverse]=useState<DerivativeUniverse|null>(null);
 const[segment,setSegment]=useState<DerivativeSegment>('OPTIONS');
 const[expiry,setExpiry]=useState('');
 useEffect(()=>{let alive=true;fetch(`/api/derivatives/universe?instrument=${encodeURIComponent(instrumentId)}`,{cache:'no-store'}).then(r=>r.json()).then((d:DerivativeUniverse)=>{if(alive)setUniverse(d)}).catch(()=>alive&&setUniverse(null));return()=>{alive=false}},[instrumentId]);
 const expiries=useMemo(()=>[...new Set((universe?.contracts??[]).filter(c=>c.segment===segment).map(c=>c.expiry))].sort(),[universe,segment]);
 useEffect(()=>{if(expiries.length&&!expiries.includes(expiry))setExpiry(expiries[0]);if(!expiries.length)setExpiry('')},[expiries,expiry]);
 const rows=(universe?.contracts??[]).filter(c=>c.segment===segment&&(!expiry||c.expiry===expiry));
 return <div className={styles.root}>
  <div className={styles.bar}>
   <b>DERIVATIVES</b>
   <select value={segment} onChange={e=>setSegment(e.target.value as DerivativeSegment)}><option value="OPTIONS">INDEX OPTIONS</option><option value="FUTURES">INDEX FUTURES</option></select>
   <select value={expiry} onChange={e=>setExpiry(e.target.value)} disabled={!expiries.length}><option value="">{expiries.length?'SELECT EXPIRY':'NO EXPIRY DATA'}</option>{expiries.map(x=><option key={x}>{x}</option>)}</select>
   <span>{universe?.state??'OFFLINE'}</span>
  </div>
  <section className={styles.panel}>
   {rows.length?<table className={styles.table}><thead><tr><th>CONTRACT</th><th>TYPE</th><th>STRIKE</th><th>LOT</th><th>LTP</th><th>BID</th><th>ASK</th><th>OI</th><th>VOL</th><th>IV</th><th>DELTA</th></tr></thead><tbody>{rows.map(c=><tr key={c.instrumentKey}><td>{c.symbol}</td><td>{c.optionSide??'FUT'}</td><td>{c.strike??'—'}</td><td>{c.lotSize}</td><td>{c.last??'—'}</td><td>{c.bid??'—'}</td><td>{c.ask??'—'}</td><td>{c.oi??'—'}</td><td>{c.volume??'—'}</td><td>{c.iv??'—'}</td><td>{c.delta??'—'}</td></tr>)}</tbody></table>:<div className={styles.empty}>No real {segment.toLowerCase()} contracts are loaded yet. Expiry, strikes, lot size, quotes, OI and Greeks will come from the Upstox derivative universe; nothing is fabricated.</div>}
  </section>
 </div>
}
