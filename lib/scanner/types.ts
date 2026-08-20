import type {CanonicalInstrumentId,Direction,OpportunityState} from '../market/events';
export interface ScannerCandidate{instrumentId:CanonicalInstrumentId;symbol:string;direction:Direction;strategy:string;score:number;state:OpportunityState;regime:string;dataQuality:number;event:string;updatedAt:number;waitingFor:string}
