'use client';
import {useState} from 'react';
import {useWorkstation} from './WorkstationProvider';
import DerivativesWorkspace from './DerivativesWorkspace';
export default function PaperDerivativeTicket(){const{instrumentId}=useWorkstation();const[segment,setSegment]=useState<'CASH'|'OPTIONS'|'FUTURES'>('OPTIONS');return <section style={{border:'1px solid var(--border,#ddd)',padding:10}}>
 <div style={{display:'flex',gap:8,alignItems:'center'}}><b>DERIVATIVE PAPER TICKET</b><select value={segment} onChange={e=>setSegment(e.target.value as typeof segment)}><option value="OPTIONS">INDEX OPTIONS</option><option value="FUTURES">INDEX FUTURES</option><option value="CASH">UNDERLYING</option></select></div>
 {segment==='CASH'?<p style={{fontSize:11}}>Underlying: {instrumentId}</p>:<DerivativesWorkspace instrumentId={instrumentId}/>}
 <p style={{fontSize:10,opacity:.65}}>A derivative order can only be submitted after a real contract and quote are available. Contract keys, expiries and lot sizes are never invented.</p>
 </section>}
