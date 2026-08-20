import type {CanonicalInstrumentId} from '@/lib/market/events';
import type {DerivativeUniverse} from './types';
const universes=new Map<CanonicalInstrumentId,DerivativeUniverse>();
export const setDerivativeUniverse=(u:DerivativeUniverse)=>universes.set(u.underlyingId,u);
export const getDerivativeUniverse=(id:CanonicalInstrumentId):DerivativeUniverse=>universes.get(id)??{underlyingId:id,state:'OFFLINE',contracts:[],updatedAt:Date.now()};
