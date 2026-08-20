import type { StrategyId } from '@/lib/market/events';

export interface StrategyPerformanceSample {
  strategyId: StrategyId;
  at: number;
  resultR: number;
  predictedScore: number;
  regime: string;
}

export interface StrategyHealth {
  strategyId: StrategyId;
  sampleSize: number;
  expectancyR: number | null;
  winRate: number | null;
  averageWinR: number | null;
  averageLossR: number | null;
  calibrationError: number | null;
  health: 'UNKNOWN' | 'HEALTHY' | 'WATCH' | 'DEGRADED';
}

export function evaluateStrategyHealth(strategyId: StrategyId, samples: StrategyPerformanceSample[]): StrategyHealth {
  const rows = samples.filter((sample) => sample.strategyId === strategyId).slice(-100);
  if (rows.length < 10) return { strategyId, sampleSize: rows.length, expectancyR: null, winRate: null, averageWinR: null, averageLossR: null, calibrationError: null, health: 'UNKNOWN' };
  const wins = rows.filter((row) => row.resultR > 0);
  const losses = rows.filter((row) => row.resultR < 0);
  const mean = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const expectancyR = mean(rows.map((row) => row.resultR));
  const winRate = (wins.length / rows.length) * 100;
  const averageWinR = wins.length ? mean(wins.map((row) => row.resultR)) : 0;
  const averageLossR = losses.length ? mean(losses.map((row) => row.resultR)) : 0;
  const actuals = rows.map((row) => row.resultR > 0 ? 100 : 0);
  const calibrationError = mean(rows.map((row, index) => Math.abs(row.predictedScore - actuals[index])));
  let health: StrategyHealth['health'] = 'HEALTHY';
  if (expectancyR < 0 || calibrationError > 35) health = 'DEGRADED';
  else if (expectancyR < 0.15 || calibrationError > 25) health = 'WATCH';
  return { strategyId, sampleSize: rows.length, expectancyR, winRate, averageWinR, averageLossR, calibrationError, health };
}
