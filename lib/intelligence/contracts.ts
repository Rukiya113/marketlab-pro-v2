import type {
  CanonicalInstrumentId,
  CandleInterval,
  Direction,
  StrategyId,
} from '@/lib/market/events';

export type EvidenceStatus = 'PASS' | 'WARN' | 'FAIL' | 'UNKNOWN';
export type BrainState = 'OFFLINE' | 'INSUFFICIENT_DATA' | 'WAIT' | 'READY';
export type RegimeId = 'TREND' | 'RANGE' | 'BREAKOUT' | 'VOLATILE' | 'TRANSITION' | 'UNKNOWN';
export type StructureTrend = 'BULLISH' | 'BEARISH' | 'MIXED' | 'UNKNOWN';
export type LiquiditySide = 'BUY_SIDE' | 'SELL_SIDE';
export type OpportunityLifecycleState =
  | 'DISCOVERED'
  | 'WATCHING'
  | 'ARMED'
  | 'TRIGGERED'
  | 'READY'
  | 'INVALIDATED'
  | 'EXPIRED'
  | 'CLOSED';

export interface EvidenceItem {
  id: string;
  label: string;
  status: EvidenceStatus;
  value?: string | number | boolean | null;
  weight: number;
  reason: string;
  timeframe?: CandleInterval;
}

export interface FeatureFrame {
  instrumentId: CanonicalInstrumentId;
  interval: CandleInterval;
  at: number;
  candleCount: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema9: number;
  ema20: number;
  ema50: number | null;
  atr14: number;
  atrPct: number;
  rsi14: number;
  volumeAverage20: number;
  volumeRatio: number;
  rangePct: number;
  bodyPct: number;
  upperWickPct: number;
  lowerWickPct: number;
  momentum3: number;
  momentum5: number;
  trendSlope: number;
  distanceFromEma20Atr: number;
}

export interface SwingPoint {
  index: number;
  at: number;
  price: number;
  kind: 'HIGH' | 'LOW';
}

export interface StructureSnapshot {
  trend: StructureTrend;
  direction: Direction;
  bos: boolean;
  choch: boolean;
  higherHigh: boolean;
  higherLow: boolean;
  lowerHigh: boolean;
  lowerLow: boolean;
  lastSwingHigh: number | null;
  lastSwingLow: number | null;
  previousSwingHigh: number | null;
  previousSwingLow: number | null;
  compression: boolean;
  displacement: boolean;
  score: number;
  evidence: EvidenceItem[];
}

export interface LiquidityLevel {
  id: string;
  side: LiquiditySide;
  price: number;
  source: 'SWING' | 'EQUAL_HIGH' | 'EQUAL_LOW' | 'SESSION' | 'RANGE';
  strength: number;
  swept: boolean;
  distanceAtr: number;
}

export interface LiquiditySnapshot {
  nearestBuySide: LiquidityLevel | null;
  nearestSellSide: LiquidityLevel | null;
  equalHighs: number[];
  equalLows: number[];
  buySideSweep: boolean;
  sellSideSweep: boolean;
  score: number;
  evidence: EvidenceItem[];
}

export interface RegimeSnapshot {
  regime: RegimeId;
  confidence: number;
  trendStrength: number;
  compression: number;
  volatilityScore: number;
  participationScore: number;
  evidence: EvidenceItem[];
}

export interface ContextBrainResult {
  state: BrainState;
  direction: Direction;
  probability: number;
  regime: RegimeSnapshot;
  structure30m: StructureSnapshot | null;
  structure15m: StructureSnapshot;
  liquidity15m: LiquiditySnapshot;
  locationQuality: number;
  contradictionScore: number;
  evidence: EvidenceItem[];
  counterThesis: string[];
  summary: string;
}

export interface OrderFlowSummary { direction: Direction; score: number; relativeVolume: number; absorptionRisk: number; evidence: EvidenceItem[]; }
export interface ImbalanceSummary { displacementScore: number; bullishActive: number; bearishActive: number; evidence: EvidenceItem[]; }

export interface SetupBrainResult {
  state: BrainState;
  direction: Direction;
  setupQuality: number;
  structure5m: StructureSnapshot;
  liquidity5m: LiquiditySnapshot;
  orderFlow5m: OrderFlowSummary;
  imbalance5m: ImbalanceSummary;
  locationQuality: number;
  displacementQuality: number;
  pullbackQuality: number;
  breakoutRetestQuality: number;
  sweepReversalQuality: number;
  evidence: EvidenceItem[];
  invalidationReasons: string[];
  summary: string;
}

export interface ExecutionBrainResult {
  state: BrainState;
  direction: Direction;
  executionQuality: number;
  triggerQuality: number;
  momentumQuality: number;
  participationQuality: number;
  antiChaseQuality: number;
  signalAgeMs: number | null;
  displacementAtr: number;
  evidence: EvidenceItem[];
  blockers: string[];
  summary: string;
}

export interface StrategyEvaluation {
  id: StrategyId;
  label: string;
  direction: Direction;
  eligible: boolean;
  score: number;
  regimeCompatibility: number;
  contextScore: number;
  setupScore: number;
  executionScore: number;
  locationScore: number;
  evidence: EvidenceItem[];
  blockers: string[];
  reason: string;
}

export interface StrategyCompetitionResult {
  selected: StrategyEvaluation | null;
  evaluations: StrategyEvaluation[];
  reason: string;
}

export interface AsuraDecision {
  instrumentId: CanonicalInstrumentId;
  at: number;
  state: BrainState;
  direction: Direction;
  directionProbability: number;
  regime: RegimeId;
  context: ContextBrainResult;
  setup: SetupBrainResult;
  execution: ExecutionBrainResult;
  competition: StrategyCompetitionResult;
  setupQuality: number;
  locationQuality: number;
  executionQuality: number;
  dataQuality: number;
  riskQuality: number;
  uncertainty: number;
  opportunityScore: number;
  historicalExpectancyR: number | null;
  netExpectedValueR: number | null;
  optionsQuality: number | null;
  entryZone: [number, number] | null;
  invalidation: number | null;
  targets: number[];
  evidence: EvidenceItem[];
  counterThesis: string[];
  waitingFor: string[];
  summary: string;
}

export interface OpportunityRecord {
  id: string;
  instrumentId: CanonicalInstrumentId;
  strategyId: StrategyId | null;
  direction: Direction;
  state: OpportunityLifecycleState;
  score: number;
  createdAt: number;
  updatedAt: number;
  validUntil: number;
  entryZone: [number, number] | null;
  invalidation: number | null;
  targets: number[];
  reasons: string[];
  invalidationReasons: string[];
}
