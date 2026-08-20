import type { StrategyEvaluation } from '../contracts';
import type { StrategyEvaluator } from './base';
import { clamp, weightedScore } from '../math';

export const evaluateLiquiditySweep: StrategyEvaluator = ({ context, setup, execution }): StrategyEvaluation => {
  const blockers: string[] = [];
  const expectedSweep = context.direction === 'BULLISH' ? setup.liquidity5m.sellSideSweep : context.direction === 'BEARISH' ? setup.liquidity5m.buySideSweep : false;
  if (!expectedSweep) blockers.push('Required opposing-side liquidity sweep is absent.');
  if (setup.sweepReversalQuality < 60) blockers.push('Sweep reversal quality is below threshold.');
  const regimeCompatibility = context.regime.regime === 'RANGE' || context.regime.regime === 'VOLATILE' || context.regime.regime === 'TRANSITION' ? 85 : 60;
  const score = weightedScore([[context.probability, 0.15], [setup.sweepReversalQuality, 0.35], [setup.locationQuality, 0.2], [execution.executionQuality, 0.2], [regimeCompatibility, 0.1]]);
  const eligible = blockers.length === 0 && score >= 65;
  return {
    id: 'LIQUIDITY_SWEEP', label: 'Liquidity Sweep Reversal Scalper', direction: context.direction,
    eligible, score: Math.round(clamp(score)), regimeCompatibility, contextScore: context.probability,
    setupScore: setup.sweepReversalQuality, executionScore: execution.executionQuality, locationScore: setup.locationQuality,
    evidence: [...setup.liquidity5m.evidence, ...setup.evidence.slice(0, 5), ...execution.evidence], blockers,
    reason: eligible ? 'Liquidity sweep, reversal location and execution evidence align.' : blockers[0] ?? 'Score below threshold.',
  };
};
