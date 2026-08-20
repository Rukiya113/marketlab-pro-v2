import type { CanonicalCandle, CanonicalInstrumentId, Direction } from '@/lib/market/events';

export type XRayStructureLabel = 'HH' | 'HL' | 'LH' | 'LL';
export type XRayEventKind = 'BOS' | 'CHOCH';
export type LiquidityKind =
  | 'BUY_SIDE'
  | 'SELL_SIDE'
  | 'EQUAL_HIGHS'
  | 'EQUAL_LOWS'
  | 'SESSION_HIGH'
  | 'SESSION_LOW';
export type ImbalanceKind = 'BULLISH_FVG' | 'BEARISH_FVG';
export type HeatState = 'COLD' | 'NEUTRAL' | 'WARM' | 'HOT';

export interface SwingPoint {
  index: number;
  time: number;
  price: number;
  type: 'HIGH' | 'LOW';
  label: XRayStructureLabel | null;
}

export interface StructureEvent {
  index: number;
  time: number;
  price: number;
  kind: XRayEventKind;
  direction: Direction;
  brokenSwingPrice: number;
}

export interface StructureAnalysis {
  direction: Direction;
  swings: SwingPoint[];
  events: StructureEvent[];
  latestLabel: XRayStructureLabel | null;
  lastSwingHigh: number | null;
  lastSwingLow: number | null;
}

export interface LiquidityLevel {
  id: string;
  kind: LiquidityKind;
  price: number;
  createdAt: number;
  touchedAt: number | null;
  sweptAt: number | null;
  strength: number;
  active: boolean;
}

export interface LiquidityAnalysis {
  levels: LiquidityLevel[];
  nearestBuySide: LiquidityLevel | null;
  nearestSellSide: LiquidityLevel | null;
  recentSweep: LiquidityLevel | null;
}

export interface OrderFlowBar {
  time: number;
  close: number;
  volume: number;
  bodyPct: number;
  signedPressure: number;
  displacement: number;
}

export interface OrderFlowAnalysis {
  bars: OrderFlowBar[];
  pressure: number;
  direction: Direction;
  participation: 'LOW' | 'NORMAL' | 'HIGH';
  displacement: number;
}

export interface ImbalanceZone {
  id: string;
  kind: ImbalanceKind;
  low: number;
  high: number;
  createdAt: number;
  mitigatedAt: number | null;
  active: boolean;
}

export interface ImbalanceAnalysis {
  zones: ImbalanceZone[];
  nearestBullish: ImbalanceZone | null;
  nearestBearish: ImbalanceZone | null;
}

export interface VolumeNode {
  price: number;
  volume: number;
  pct: number;
}

export interface VolumeProfileAnalysis {
  nodes: VolumeNode[];
  poc: number | null;
  valueAreaLow: number | null;
  valueAreaHigh: number | null;
}

export interface HeatCell {
  label: string;
  score: number;
  state: HeatState;
  detail: string;
}

export interface HeatmapAnalysis {
  score: number;
  state: HeatState;
  cells: HeatCell[];
}

export interface XRaySnapshot {
  instrumentId: CanonicalInstrumentId;
  interval: CanonicalCandle['interval'];
  generatedAt: number;
  candleCount: number;
  lastPrice: number | null;
  structure: StructureAnalysis;
  liquidity: LiquidityAnalysis;
  orderFlow: OrderFlowAnalysis;
  imbalances: ImbalanceAnalysis;
  volumeProfile: VolumeProfileAnalysis;
  heatmap: HeatmapAnalysis;
}
