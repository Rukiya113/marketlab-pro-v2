import type { StrategyEvaluation } from '../contracts';
import type { StrategyEvaluator } from './base';
import { clamp, weightedScore } from '../math';

export const evaluateTrendPullback: StrategyEvaluator = ({ context, setup, execution }): StrategyEvaluation => {
  const blockers: string[] = [];
  if (context.regime.regime !== 'TREND') blockers.push('Regime is not TREND.');
  if (context.direction !== 'BULLISH' && context.direction !== 'BEARISH') blockers.push('No directional context.');
  if (setup.pullbackQuality < 55) blockers.push('Pullback quality is below threshold.');
  const regimeCompatibility = context.regime.regime === 'TREND' ? context.regime.confidence : 25;
  const score = weightedScore([[context.probability, 0.2], [setup.pullbackQuality, 0.3], [setup.locationQuality, 0.2], [execution.executionQuality, 0.2], [regimeCompatibility, 0.1]]);
  const eligible = blockers.length === 0 && score >= 62;
  return {
    id: 'TREND_PULLBACK', label: 'Trend Pullback Scalper', direction: context.direction,
    eligible, score: Math.round(clamp(score)), regimeCompatibility: Math.round(regimeCompatibility),
    contextScore: context.probability, setupScore: setup.pullbackQuality, executionScore: execution.executionQuality, locationScore: setup.locationQuality,
    evidence: [...context.evidence.slice(0, 4), ...setup.evidence.slice(0, 4), ...execution.evidence], blockers,
    reason: eligible ? 'Trend regime, useful pullback location and execution evidence align.' : blockers[0] ?? 'Score below threshold.',
  };
};
