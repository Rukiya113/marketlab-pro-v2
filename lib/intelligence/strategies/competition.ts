import type { StrategyCompetitionResult } from '../contracts';
import type { StrategyContext } from './base';
import { evaluateTrendPullback } from './trendPullback';
import { evaluateLiquiditySweep } from './liquiditySweep';
import { evaluateBreakoutRetest } from './breakoutRetest';

export function runStrategyCompetition(input: StrategyContext): StrategyCompetitionResult {
  const evaluations = [evaluateTrendPullback(input), evaluateLiquiditySweep(input), evaluateBreakoutRetest(input)]
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score);
  const selected = evaluations.find((evaluation) => evaluation.eligible) ?? null;
  return {
    selected,
    evaluations,
    reason: selected ? `${selected.label} selected at score ${selected.score}; incompatible or weaker strategies remain visible but are not averaged into the winner.` : 'No strategy currently satisfies its eligibility and score gates.',
  };
}
