import type { CanonicalInstrumentId } from './events';
export interface InstrumentIdentity { id: CanonicalInstrumentId; upstoxKey: string; displayName: string; exchange: string; segment: string; type: 'INDEX'|'EQUITY'|'OPTION'|'FUTURE'; timezone: 'Asia/Kolkata'; }
export const CORE_INSTRUMENTS: InstrumentIdentity[] = [
  { id:'IN:NSE:INDEX:NIFTY50', upstoxKey:'NSE_INDEX|Nifty 50', displayName:'NIFTY 50', exchange:'NSE', segment:'INDEX', type:'INDEX', timezone:'Asia/Kolkata' },
  { id:'IN:NSE:INDEX:BANKNIFTY', upstoxKey:'NSE_INDEX|Nifty Bank', displayName:'BANKNIFTY', exchange:'NSE', segment:'INDEX', type:'INDEX', timezone:'Asia/Kolkata' },
  { id:'IN:BSE:INDEX:SENSEX', upstoxKey:'BSE_INDEX|SENSEX', displayName:'SENSEX', exchange:'BSE', segment:'INDEX', type:'INDEX', timezone:'Asia/Kolkata' },
  { id:'IN:NSE:INDEX:INDIAVIX', upstoxKey:'NSE_INDEX|India VIX', displayName:'INDIA VIX', exchange:'NSE', segment:'INDEX', type:'INDEX', timezone:'Asia/Kolkata' },
];
export const byUpstoxKey = new Map(CORE_INSTRUMENTS.map(x => [x.upstoxKey, x]));
