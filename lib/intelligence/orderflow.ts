import type { CanonicalCandle, Direction } from '@/lib/market/events';
import type { EvidenceItem } from './contracts';
import { clamp, mean, weightedScore } from './math';

export interface OrderFlowSnapshot {
  direction: Direction;
  score: number;
  relativeVolume: number;
  directionalBodyScore: number;
  closeLocationScore: number;
  impulseScore: number;
  absorptionRisk: number;
  evidence: EvidenceItem[];
}

export function analyzeOrderFlow(candles: CanonicalCandle[]): OrderFlowSnapshot {
  if (candles.length < 12) {
    return {
      direction: 'NEUTRAL', score: 0, relativeVolume: 0, directionalBodyScore: 0,
      closeLocationScore: 0, impulseScore: 0, absorptionRisk: 100,
      evidence: [{ id: 'orderflow.data', label: 'Order-flow proxy history', status: 'UNKNOWN', weight: 1, reason: 'At least 12 candles are required.' }],
    };
  }
  const ordered = [...candles].sort((a, b) => a.start - b.start);
  const current = ordered.at(-1)!;
  const history = ordered.slice(-11, -1);
  const avgVolume = mean(history.map((candle) => candle.volume));
  const avgRange = mean(history.map((candle) => candle.high - candle.low));
  const range = Math.max(current.high - current.low, 1e-9);
  const body = current.close - current.open;
  const bodyShare = Math.abs(body) / range;
  const relativeVolume = avgVolume > 0 ? current.volume / avgVolume : 0;
  const closeLocation = (current.close - current.low) / range;
  const bullishCloseQuality = closeLocation * 100;
  const bearishCloseQuality = (1 - closeLocation) * 100;
  const expansion = avgRange > 0 ? range / avgRange : 0;
  const directionalBodyScore = clamp(bodyShare * 100);
  const impulseScore = clamp(relativeVolume * 35 + expansion * 30 + directionalBodyScore * 0.35);
  let direction: Direction = 'NEUTRAL';
  if (body > 0 && bullishCloseQuality >= 60) direction = 'BULLISH';
  if (body < 0 && bearishCloseQuality >= 60) direction = 'BEARISH';
  const closeLocationScore = direction === 'BULLISH' ? bullishCloseQuality : direction === 'BEARISH' ? bearishCloseQuality : 50;
  const absorptionRisk = clamp(
    (relativeVolume > 1.5 && bodyShare < 0.35 ? 65 : 20) +
    (Math.max(current.high - Math.max(current.open, current.close), Math.min(current.open, current.close) - current.low) / range) * 35,
  );
  const score = weightedScore([
    [directionalBodyScore, 0.25],
    [closeLocationScore, 0.25],
    [clamp(relativeVolume * 60), 0.25],
    [impulseScore, 0.25],
  ]);
  const evidence: EvidenceItem[] = [
    { id: 'orderflow.volume', label: 'Relative volume', status: relativeVolume >= 1.2 ? 'PASS' : relativeVolume >= 0.8 ? 'WARN' : 'FAIL', value: Number(relativeVolume.toFixed(2)), weight: 1.5, reason: `Current volume is ${relativeVolume.toFixed(2)}x the recent average.` },
    { id: 'orderflow.body', label: 'Directional body', status: directionalBodyScore >= 60 ? 'PASS' : 'WARN', value: Math.round(directionalBodyScore), weight: 1, reason: 'Measures how much of the candle range is directional body.' },
    { id: 'orderflow.close', label: 'Close location', status: closeLocationScore >= 65 ? 'PASS' : 'WARN', value: Math.round(closeLocationScore), weight: 1, reason: `Close location supports ${direction}.` },
    { id: 'orderflow.absorption', label: 'Absorption risk', status: absorptionRisk < 45 ? 'PASS' : absorptionRisk < 70 ? 'WARN' : 'FAIL', value: Math.round(absorptionRisk), weight: 1, reason: 'Flags high-volume candles with weak body or dominant rejection wicks.' },
  ];
  return { direction, score: Math.round(score), relativeVolume, directionalBodyScore: Math.round(directionalBodyScore), closeLocationScore: Math.round(closeLocationScore), impulseScore: Math.round(impulseScore), absorptionRisk: Math.round(absorptionRisk), evidence };
}
