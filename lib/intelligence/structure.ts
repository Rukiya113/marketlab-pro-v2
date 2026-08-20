import type { CanonicalCandle, Direction } from '@/lib/market/events';
import type { EvidenceItem, StructureSnapshot, SwingPoint } from './contracts';
import { clamp, scoreFromEvidence } from './math';

function swings(candles: CanonicalCandle[], radius = 2): SwingPoint[] {
  const result: SwingPoint[] = [];
  for (let i = radius; i < candles.length - radius; i += 1) {
    const candle = candles[i];
    const neighborhood = candles.slice(i - radius, i + radius + 1);
    if (neighborhood.every((item) => candle.high >= item.high)) result.push({ index: i, at: candle.start, price: candle.high, kind: 'HIGH' });
    if (neighborhood.every((item) => candle.low <= item.low)) result.push({ index: i, at: candle.start, price: candle.low, kind: 'LOW' });
  }
  return result;
}

export function analyzeStructure(candles: CanonicalCandle[]): StructureSnapshot {
  if (candles.length < 8) {
    return {
      trend: 'UNKNOWN', direction: 'NEUTRAL', bos: false, choch: false,
      higherHigh: false, higherLow: false, lowerHigh: false, lowerLow: false,
      lastSwingHigh: null, lastSwingLow: null, previousSwingHigh: null, previousSwingLow: null,
      compression: false, displacement: false, score: 0,
      evidence: [{ id: 'structure.data', label: 'Structure history', status: 'UNKNOWN', weight: 1, reason: 'At least 8 candles are required.' }],
    };
  }
  const ordered = [...candles].sort((a, b) => a.start - b.start);
  const points = swings(ordered);
  const highs = points.filter((point) => point.kind === 'HIGH');
  const lows = points.filter((point) => point.kind === 'LOW');
  const lastHigh = highs.at(-1) ?? null;
  const previousHigh = highs.at(-2) ?? null;
  const lastLow = lows.at(-1) ?? null;
  const previousLow = lows.at(-2) ?? null;
  const current = ordered.at(-1)!;
  const higherHigh = Boolean(lastHigh && previousHigh && lastHigh.price > previousHigh.price);
  const higherLow = Boolean(lastLow && previousLow && lastLow.price > previousLow.price);
  const lowerHigh = Boolean(lastHigh && previousHigh && lastHigh.price < previousHigh.price);
  const lowerLow = Boolean(lastLow && previousLow && lastLow.price < previousLow.price);
  const priorHigh = Math.max(...ordered.slice(-7, -1).map((candle) => candle.high));
  const priorLow = Math.min(...ordered.slice(-7, -1).map((candle) => candle.low));
  const bullishBos = current.close > priorHigh;
  const bearishBos = current.close < priorLow;
  const structuralBullish = higherHigh && higherLow;
  const structuralBearish = lowerHigh && lowerLow;
  const choch = Boolean((structuralBearish && bullishBos) || (structuralBullish && bearishBos));
  const recentRanges = ordered.slice(-6).map((candle) => candle.high - candle.low);
  const olderRanges = ordered.slice(-12, -6).map((candle) => candle.high - candle.low);
  const recentMean = recentRanges.reduce((a, b) => a + b, 0) / Math.max(1, recentRanges.length);
  const olderMean = olderRanges.reduce((a, b) => a + b, 0) / Math.max(1, olderRanges.length);
  const compression = olderMean > 0 && recentMean < olderMean * 0.68;
  const currentRange = current.high - current.low;
  const displacement = recentMean > 0 && currentRange > recentMean * 1.55 && Math.abs(current.close - current.open) / Math.max(currentRange, 1e-9) > 0.65;
  let direction: Direction = 'NEUTRAL';
  if (structuralBullish || bullishBos) direction = 'BULLISH';
  if (structuralBearish || bearishBos) direction = 'BEARISH';
  const trend = structuralBullish ? 'BULLISH' : structuralBearish ? 'BEARISH' : 'MIXED';
  const evidence: EvidenceItem[] = [
    { id: 'structure.hh', label: 'Higher high', status: higherHigh ? 'PASS' : 'WARN', value: higherHigh, weight: 1, reason: higherHigh ? 'Latest swing high exceeded the previous swing high.' : 'No confirmed higher high.' },
    { id: 'structure.hl', label: 'Higher low', status: higherLow ? 'PASS' : 'WARN', value: higherLow, weight: 1, reason: higherLow ? 'Latest swing low held above the previous swing low.' : 'No confirmed higher low.' },
    { id: 'structure.lh', label: 'Lower high', status: lowerHigh ? 'PASS' : 'WARN', value: lowerHigh, weight: 1, reason: lowerHigh ? 'Latest swing high is below the previous swing high.' : 'No confirmed lower high.' },
    { id: 'structure.ll', label: 'Lower low', status: lowerLow ? 'PASS' : 'WARN', value: lowerLow, weight: 1, reason: lowerLow ? 'Latest swing low broke below the previous swing low.' : 'No confirmed lower low.' },
    { id: 'structure.bos', label: 'Break of structure', status: bullishBos || bearishBos ? 'PASS' : 'WARN', value: bullishBos ? 'BULLISH' : bearishBos ? 'BEARISH' : false, weight: 2, reason: bullishBos || bearishBos ? 'Close broke the recent structural range.' : 'No fresh close outside the recent structural range.' },
    { id: 'structure.displacement', label: 'Displacement', status: displacement ? 'PASS' : 'WARN', value: displacement, weight: 1.5, reason: displacement ? 'Current candle expanded with directional body dominance.' : 'No strong displacement candle.' },
  ];
  return {
    trend,
    direction,
    bos: bullishBos || bearishBos,
    choch,
    higherHigh, higherLow, lowerHigh, lowerLow,
    lastSwingHigh: lastHigh?.price ?? null,
    lastSwingLow: lastLow?.price ?? null,
    previousSwingHigh: previousHigh?.price ?? null,
    previousSwingLow: previousLow?.price ?? null,
    compression,
    displacement,
    score: Math.round(clamp(scoreFromEvidence(evidence))),
    evidence,
  };
}
