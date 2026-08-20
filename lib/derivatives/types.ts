import type { CanonicalInstrumentId } from '@/lib/market/events';
export type DerivativeSegment='OPTIONS'|'FUTURES';
export type OptionSide='CE'|'PE';
export interface DerivativeContract{
 instrumentKey:string; underlyingId:CanonicalInstrumentId; symbol:string; segment:DerivativeSegment;
 expiry:string; strike:number|null; optionSide:OptionSide|null; lotSize:number;
 bid:number|null; ask:number|null; last:number|null; oi:number|null; volume:number|null;
 iv:number|null; delta:number|null; gamma:number|null; theta:number|null; vega:number|null; at:number|null;
}
export interface DerivativeUniverse{underlyingId:CanonicalInstrumentId;state:'LIVE'|'OFFLINE';contracts:DerivativeContract[];updatedAt:number}
