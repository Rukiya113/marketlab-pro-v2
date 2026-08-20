import type { CanonicalCandle, Direction } from '@/lib/market/events';
import type { EvidenceItem } from './contracts';
import { clamp } from './math';

export interface FairValueGap {
  direction: Exclude<Direction, 'WAIT' | 'NEUTRAL'>;
  lower: number;
  upper: number;
  createdAt: number;
  midpoint: number;
  filledPct: number;
  active: boolean;
}

export interface ImbalanceSnapshot {
  bullishFvgs: FairValueGap[];
  bearishFvgs: FairValueGap[];
  nearestBullish: FairValueGap | null;
  nearestBearish: FairValueGap | null;
  displacementScore: number;
  evidence: EvidenceItem[];
}

function fillPercentage(gap: FairValueGap, candles: CanonicalCandle[]): number {
  const after = candles.filter((candle) => candle.start > gap.createdAt);
  if (!after.length) return 0;
  if (gap.direction === 'BULLISH') {
    const minLow = Math.min(...after.map((candle) => candle.low));
    if (minLow >= gap.upper) return 0;
    return clamp(((gap.upper - Math.max(minLow, gap.lower)) / Math.max(gap.upper - gap.lower, 1e-9)) * 100);
  }
  const maxHigh = Math.max(...after.map((candle) => candle.high));
  if (maxHigh <= gap.lower) return 0;
  return clamp(((Math.min(maxHigh, gap.upper) - gap.lower) / Math.max(gap.upper - gap.lower, 1e-9)) * 100);
}

export function analyzeImbalances(candles: CanonicalCandle[]): ImbalanceSnapshot {
  const ordered = [...candles].sort((a, b) => a.start - b.start);
  const bullishFvgs: FairValueGap[] = [];
  const bearishFvgs: FairValueGap[] = [];
  for (let i = 2; i < ordered.length; i += 1) {
    const left = ordered[i - 2];
    const middle = ordered[i - 1];
    const right = ordered[i];
    if (right.low > left.high) {
      const base: FairValueGap = { direction: 'BULLISH', lower: left.high, upper: right.low, createdAt: middle.start, midpoint: (left.high + right.low) / 2, filledPct: 0, active: true };
      base.filledPct = fillPercentage(base, ordered); base.active = base.filledPct < 95; bullishFvgs.push(base);
    }
    if (right.high < left.low) {
      const base: FairValueGap = { direction: 'BEARISH', lower: right.high, upper: left.low, createdAt: middle.start, midpoint: (right.high + left.low) / 2, filledPct: 0, active: true };
      base.filledPct = fillPercentage(base, ordered); base.active = base.filledPct < 95; bearishFvgs.push(base);
    }
  }
  const current = ordered.at(-1)?.close ?? 0;
  const nearest = (gaps: FairValueGap[]) => gaps.filter((gap) => gap.active).sort((a, b) => Math.abs(a.midpoint - current) - Math.abs(b.midpoint - current))[0] ?? null;
  const activeBull = bullishFvgs.filter((gap) => gap.active);
  const activeBear = bearishFvgs.filter((gap) => gap.active);
  const latest = ordered.slice(-6);
  const ranges = latest.map((candle) => candle.high - candle.low);
  const bodies = latest.map((candle) => Math.abs(candle.close - candle.open));
  const bodyDominance = ranges.length ? bodies.reduce((a, b) => a + b, 0) / Math.max(ranges.reduce((a, b) => a + b, 0), 1e-9) : 0;
  const displacementScore = clamp(bodyDominance * 100 + Math.min(30, (activeBull.length + activeBear.length) * 8));
  const evidence: EvidenceItem[] = [
    { id: 'imbalance.bull', label: 'Active bullish FVGs', status: activeBull.length ? 'PASS' : 'WARN', value: activeBull.length, weight: 1, reason: `${activeBull.length} active bullish imbalance(s) detected.` },
    { id: 'imbalance.bear', label: 'Active bearish FVGs', status: activeBear.length ? 'PASS' : 'WARN', value: activeBear.length, weight: 1, reason: `${activeBear.length} active bearish imbalance(s) detected.` },
    { id: 'imbalance.displacement', label: 'Displacement quality', status: displacementScore >= 60 ? 'PASS' : 'WARN', value: Math.round(displacementScore), weight: 1.5, reason: 'Rates body dominance and persistence of nearby imbalances.' },
  ];
  return { bullishFvgs: bullishFvgs.slice(-12), bearishFvgs: bearishFvgs.slice(-12), nearestBullish: nearest(bullishFvgs), nearestBearish: nearest(bearishFvgs), displacementScore: Math.round(displacementScore), evidence };
}
