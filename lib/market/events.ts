export type CanonicalInstrumentId = `IN:${string}:${string}:${string}`;
export type CandleInterval = '1m'|'3m'|'5m'|'15m'|'30m'|'1h';
export type Direction = 'BULLISH'|'BEARISH'|'NEUTRAL'|'WAIT';
export type OpportunityState = 'DISCOVERED'|'WATCHING'|'ARMED'|'TRIGGERED'|'READY'|'INVALIDATED'|'EXPIRED'|'CLOSED';
export type DataQualityState = 'HEALTHY'|'DEGRADED'|'STALE'|'UNTRUSTED'|'OFFLINE';
export type StrategyId = 'TREND_PULLBACK'|'LIQUIDITY_SWEEP'|'BREAKOUT_RETEST';
export type SentinelDecision = 'APPROVED'|'WAIT'|'BLOCKED';
export type MarketEventType = 'TICK'|'MARKET_STATUS'|'CANDLE'|'DATA_QUALITY'|'GATEWAY_STATUS'|'INTELLIGENCE'|'OPPORTUNITY'|'SENTINEL';
export interface CanonicalTick{type:'TICK';eventId:string;instrumentId:CanonicalInstrumentId;providerInstrumentKey:string;price:number;close?:number;quantity?:number;exchangeTimestamp:number;providerTimestamp:number;gatewayReceivedAt:number;decodedAt:number}
export interface CanonicalCandle{type:'CANDLE';eventId:string;instrumentId:CanonicalInstrumentId;interval:CandleInterval;start:number;end:number;open:number;high:number;low:number;close:number;volume:number;forming:boolean;marketTimestamp:number}
export interface GatewayStatusEvent{type:'GATEWAY_STATUS';eventId:string;state:'WAITING_FOR_TOKEN'|'CONNECTING'|'LIVE'|'RECONNECTING'|'OFFLINE'|'ERROR';at:number;detail?:string}
export interface DataQualityEvent{type:'DATA_QUALITY';eventId:string;state:DataQualityState;at:number;latencyMs?:number;reason?:string}
export interface StrategyScoreSnapshot{id:StrategyId;label:string;score:number;eligible:boolean;reason:string;direction:Direction}
export interface IntelligenceDecisionEvent{type:'INTELLIGENCE';eventId:string;instrumentId:CanonicalInstrumentId;at:number;direction:Direction;directionProbability:number;setupQuality:number;locationQuality:number;executionQuality:number;dataQuality:number;historicalExpectancyR:number|null;optionsQuality:number|null;riskQuality:number;uncertainty:number;netExpectedValueR:number|null;opportunityScore:number;regime:string;strategy:string;strategyScores:StrategyScoreSnapshot[];context30m:string;structure15m:string;setup5m:string;execution1m:string;reasons:string[];counterThesis:string[];invalidation?:number;entryZone?:[number,number];targets?:number[]}
export interface OpportunityEvent{type:'OPPORTUNITY';eventId:string;opportunityId:string;instrumentId:CanonicalInstrumentId;at:number;state:OpportunityState;strategy:string;score:number;validUntil:number;entryZone?:[number,number];invalidation?:number;targets?:number[]}
export interface SentinelEvent{type:'SENTINEL';eventId:string;instrumentId:CanonicalInstrumentId;at:number;decision:SentinelDecision;reasons:string[];checks:Record<string,'PASS'|'WAIT'|'FAIL'>}
export type CanonicalMarketEvent=CanonicalTick|CanonicalCandle|GatewayStatusEvent|DataQualityEvent|IntelligenceDecisionEvent|OpportunityEvent|SentinelEvent;
