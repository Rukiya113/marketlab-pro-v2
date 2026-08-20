import type { CanonicalInstrumentId, Direction } from '@/lib/market/events';
import type { ContextBrainResult, EvidenceItem, SetupBrainResult } from '../contracts';
import type { FeatureStore } from '../features';
import { analyzeStructure } from '../structure';
import { analyzeLiquidity } from '../liquidity';
import { analyzeOrderFlow } from '../orderflow';
import { analyzeImbalances } from '../imbalances';
import { clamp, weightedScore } from '../math';

export function runSetupBrain(instrumentId: CanonicalInstrumentId, store: FeatureStore, context: ContextBrainResult): SetupBrainResult {
  const frame = store.get(instrumentId, '5m');
  if (!frame || context.direction === 'WAIT' || context.direction === 'NEUTRAL') {
    return {
      state: 'INSUFFICIENT_DATA', direction: context.direction, setupQuality: 0,
      structure5m: analyzeStructure([]), liquidity5m: analyzeLiquidity([], 0),
      orderFlow5m: { direction: 'NEUTRAL', score: 0, relativeVolume: 0, absorptionRisk: 100, evidence: [] },
      imbalance5m: { displacementScore: 0, bullishActive: 0, bearishActive: 0, evidence: [] }, locationQuality: 0,
      displacementQuality: 0, pullbackQuality: 0, breakoutRetestQuality: 0, sweepReversalQuality: 0,
      evidence: [], invalidationReasons: ['5m data or directional context is not ready.'], summary: 'Waiting for 5m setup evidence.',
    };
  }
  const structure = analyzeStructure(store.getCandles(instrumentId, '5m'));
  const candles5m = store.getCandles(instrumentId, '5m');
  const liquidity = analyzeLiquidity(candles5m, frame.atr14);
  const orderFlow = analyzeOrderFlow(candles5m);
  const imbalances = analyzeImbalances(candles5m);
  const direction: Direction = context.direction;
  const aligned = structure.direction === direction;
  const pullbackDistance = Math.abs(frame.distanceFromEma20Atr);
  const pullbackQuality = clamp(100 - Math.abs(pullbackDistance - 0.45) * 80 + (aligned ? 12 : 0));
  const sweepMatch = direction === 'BULLISH' ? liquidity.sellSideSweep : liquidity.buySideSweep;
  const sweepReversalQuality = clamp((sweepMatch ? 70 : 20) + (structure.choch ? 20 : 0) + (frame.bodyPct > 55 ? 10 : 0));
  const breakoutRetestQuality = clamp((structure.bos ? 55 : 15) + (structure.displacement ? 25 : 0) + (Math.abs(frame.distanceFromEma20Atr) < 1.2 ? 15 : 0));
  const displacementQuality = clamp(frame.bodyPct * 0.45 + Math.min(25, frame.volumeRatio * 12) + (structure.displacement ? 15 : 0) + imbalances.displacementScore * 0.25 + orderFlow.impulseScore * 0.2);
  const locationQuality = weightedScore([[context.locationQuality, 0.55], [100 - Math.min(100, pullbackDistance * 40), 0.45]]);
  const setupQuality = weightedScore([[structure.score, 0.25], [Math.max(pullbackQuality, sweepReversalQuality, breakoutRetestQuality), 0.35], [displacementQuality, 0.2], [locationQuality, 0.2]]);
  const evidence: EvidenceItem[] = [
    { id: 'setup.alignment', label: '5m structure alignment', status: aligned ? 'PASS' : 'WARN', value: structure.direction, weight: 2, reason: aligned ? '5m structure aligns with context.' : '5m structure does not yet align with context.', timeframe: '5m' as const },
    { id: 'setup.pullback', label: 'Pullback quality', status: pullbackQuality >= 65 ? 'PASS' : 'WARN', value: Math.round(pullbackQuality), weight: 1.5, reason: 'Rates EMA/ATR pullback location and trend alignment.', timeframe: '5m' as const },
    { id: 'setup.sweep', label: 'Sweep reversal quality', status: sweepReversalQuality >= 65 ? 'PASS' : 'WARN', value: Math.round(sweepReversalQuality), weight: 1.5, reason: 'Rates liquidity sweep, reversal structure and candle quality.', timeframe: '5m' as const },
    { id: 'setup.breakout', label: 'Breakout-retest quality', status: breakoutRetestQuality >= 65 ? 'PASS' : 'WARN', value: Math.round(breakoutRetestQuality), weight: 1.5, reason: 'Rates BOS, displacement and retest proximity.', timeframe: '5m' as const },
  ];
  const invalidationReasons: string[] = [];
  if (!aligned && !structure.choch) invalidationReasons.push('5m structure is not aligned and has no corrective CHoCH.');
  if (locationQuality < 35) invalidationReasons.push('Setup location is too extended from useful structure.');
  return {
    state: setupQuality >= 65 && invalidationReasons.length === 0 ? 'READY' : 'WAIT', direction,
    setupQuality: Math.round(setupQuality), structure5m: structure, liquidity5m: liquidity,
    locationQuality: Math.round(locationQuality), displacementQuality: Math.round(displacementQuality),
    pullbackQuality: Math.round(pullbackQuality), breakoutRetestQuality: Math.round(breakoutRetestQuality), sweepReversalQuality: Math.round(sweepReversalQuality),
    orderFlow5m: { direction: orderFlow.direction, score: orderFlow.score, relativeVolume: orderFlow.relativeVolume, absorptionRisk: orderFlow.absorptionRisk, evidence: orderFlow.evidence },
    imbalance5m: { displacementScore: imbalances.displacementScore, bullishActive: imbalances.bullishFvgs.filter((gap) => gap.active).length, bearishActive: imbalances.bearishFvgs.filter((gap) => gap.active).length, evidence: imbalances.evidence },
    evidence: [...evidence, ...structure.evidence, ...liquidity.evidence, ...orderFlow.evidence, ...imbalances.evidence], invalidationReasons,
    summary: setupQuality >= 65 ? `5m setup quality ${Math.round(setupQuality)} with actionable structural evidence.` : `5m setup quality ${Math.round(setupQuality)}; continue waiting.`,
  };
}
