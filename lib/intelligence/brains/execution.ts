import type { CanonicalInstrumentId, Direction } from '@/lib/market/events';
import type { EvidenceItem, ExecutionBrainResult, SetupBrainResult } from '../contracts';
import type { FeatureStore } from '../features';
import { analyzeStructure } from '../structure';
import { clamp, weightedScore } from '../math';

function directionFromFrame(close: number, ema9: number, ema20: number): Direction {
  if (close > ema9 && ema9 > ema20) return 'BULLISH';
  if (close < ema9 && ema9 < ema20) return 'BEARISH';
  return 'NEUTRAL';
}

export function runExecutionBrain(instrumentId: CanonicalInstrumentId, store: FeatureStore, setup: SetupBrainResult, now = Date.now()): ExecutionBrainResult {
  const frame = store.get(instrumentId, '1m');
  if (!frame || (setup.direction !== 'BULLISH' && setup.direction !== 'BEARISH')) {
    return { state: 'INSUFFICIENT_DATA', direction: setup.direction, executionQuality: 0, triggerQuality: 0, momentumQuality: 0, participationQuality: 0, antiChaseQuality: 0, signalAgeMs: null, displacementAtr: 0, evidence: [], blockers: ['1m data or setup direction is unavailable.'], summary: 'Waiting for 1m execution evidence.' };
  }
  const structure = analyzeStructure(store.getCandles(instrumentId, '1m'));
  const direction = setup.direction;
  const localDirection = directionFromFrame(frame.close, frame.ema9, frame.ema20);
  const aligned = localDirection === direction;
  const displacementAtr = frame.atr14 > 0 ? Math.abs(frame.close - frame.open) / frame.atr14 : 0;
  const triggerQuality = clamp((aligned ? 45 : 10) + (structure.bos || structure.choch ? 30 : 0) + (frame.bodyPct > 60 ? 20 : 0));
  const directionalMomentum = direction === 'BULLISH' ? frame.momentum3 : -frame.momentum3;
  const momentumQuality = clamp(45 + directionalMomentum * 150 + (aligned ? 20 : 0));
  const participationQuality = clamp(frame.volumeRatio * 60);
  const extensionAtr = Math.abs(frame.distanceFromEma20Atr);
  const antiChaseQuality = clamp(100 - Math.max(0, extensionAtr - 0.8) * 45 - Math.max(0, displacementAtr - 1.6) * 25);
  const signalAgeMs = Math.max(0, now - frame.at);
  const blockers: string[] = [];
  if (!aligned) blockers.push('1m direction is not aligned with the setup.');
  if (signalAgeMs > 90_000) blockers.push('1m execution evidence is stale.');
  if (antiChaseQuality < 50) blockers.push('Price is too extended for a fresh entry.');
  if (participationQuality < 45) blockers.push('1m participation is weak.');
  const executionQuality = weightedScore([[triggerQuality, 0.35], [momentumQuality, 0.2], [participationQuality, 0.2], [antiChaseQuality, 0.25]]);
  const evidence: EvidenceItem[] = [
    { id: 'execution.trigger', label: 'Trigger quality', status: triggerQuality >= 70 ? 'PASS' : 'WARN', value: Math.round(triggerQuality), weight: 2, reason: 'Combines 1m alignment, micro structure break and candle body quality.', timeframe: '1m' as const },
    { id: 'execution.momentum', label: 'Directional momentum', status: momentumQuality >= 60 ? 'PASS' : 'WARN', value: Math.round(momentumQuality), weight: 1, reason: 'Measures short-horizon momentum in the proposed direction.', timeframe: '1m' as const },
    { id: 'execution.participation', label: 'Participation', status: participationQuality >= 55 ? 'PASS' : 'WARN', value: Math.round(participationQuality), weight: 1, reason: 'Uses relative 1m volume as participation evidence.', timeframe: '1m' as const },
    { id: 'execution.antichase', label: 'Anti-chase', status: antiChaseQuality >= 65 ? 'PASS' : antiChaseQuality >= 50 ? 'WARN' : 'FAIL', value: Math.round(antiChaseQuality), weight: 2, reason: 'Penalizes entries that are over-extended from EMA/ATR context.', timeframe: '1m' as const },
  ];
  return {
    state: executionQuality >= 72 && blockers.length === 0 ? 'READY' : 'WAIT', direction,
    executionQuality: Math.round(executionQuality), triggerQuality: Math.round(triggerQuality), momentumQuality: Math.round(momentumQuality),
    participationQuality: Math.round(participationQuality), antiChaseQuality: Math.round(antiChaseQuality), signalAgeMs, displacementAtr,
    evidence, blockers,
    summary: blockers.length ? `Execution is waiting: ${blockers[0]}` : `1m execution quality ${Math.round(executionQuality)} and ready for downstream risk gates.`,
  };
}
