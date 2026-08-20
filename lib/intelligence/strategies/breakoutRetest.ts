import type { StrategyEvaluation } from '../contracts';
import type { StrategyEvaluator } from './base';
import { clamp, weightedScore } from '../math';

export const evaluateBreakoutRetest: StrategyEvaluator = ({ context, setup, execution }): StrategyEvaluation => {
  const blockers: string[] = [];
  if (!setup.structure5m.bos) blockers.push('No confirmed 5m break of structure.');
  if (setup.breakoutRetestQuality < 60) blockers.push('Breakout/retest quality is below threshold.');
  const regimeCompatibility = context.regime.regime === 'BREAKOUT' ? 100 : context.regime.regime === 'TREND' ? 75 : 40;
  const score = weightedScore([[context.probability, 0.15], [setup.breakoutRetestQuality, 0.35], [setup.displacementQuality, 0.15], [execution.executionQuality, 0.25], [regimeCompatibility, 0.1]]);
  const eligible = blockers.length === 0 && score >= 64;
  return {
    id: 'BREAKOUT_RETEST', label: 'Breakout-Retest Scalper', direction: context.direction,
    eligible, score: Math.round(clamp(score)), regimeCompatibility, contextScore: context.probability,
    setupScore: setup.breakoutRetestQuality, executionScore: execution.executionQuality, locationScore: setup.locationQuality,
    evidence: [...setup.structure5m.evidence, ...setup.evidence.slice(0, 4), ...execution.evidence], blockers,
    reason: eligible ? 'Breakout, displacement/retest and execution evidence align.' : blockers[0] ?? 'Score below threshold.',
  };
};
