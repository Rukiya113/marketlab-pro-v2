import type { PortfolioDecision, PortfolioPolicy, PortfolioState } from './contracts';
import { clamp } from '@/lib/intelligence/math';
export const DEFAULT_PORTFOLIO_POLICY: PortfolioPolicy = { maxOpenRiskPct: 2.5, maxCorrelatedRiskPct: 1.5, maxDrawdownPct: 6, maxPositions: 3, maxConsecutiveLosses: 4 };
export function evaluatePortfolio(state: PortfolioState, policy: PortfolioPolicy = DEFAULT_PORTFOLIO_POLICY): PortfolioDecision {
  const reasons: string[] = [];
  if (state.openRiskPct >= policy.maxOpenRiskPct) reasons.push('Portfolio heat limit reached.');
  if (state.correlatedRiskPct >= policy.maxCorrelatedRiskPct) reasons.push('Correlated exposure limit reached.');
  if (state.drawdownPct >= policy.maxDrawdownPct) reasons.push('Drawdown circuit breaker active.');
  if (state.openPositions >= policy.maxPositions) reasons.push('Maximum concurrent positions reached.');
  if (state.consecutiveLosses >= policy.maxConsecutiveLosses) reasons.push('Loss-streak circuit breaker active.');
  const heatHeadroom = clamp(100 - (state.openRiskPct / Math.max(policy.maxOpenRiskPct, 0.01)) * 100);
  const drawdownHeadroom = clamp(100 - (state.drawdownPct / Math.max(policy.maxDrawdownPct, 0.01)) * 100);
  const riskMultiplier = reasons.length ? 0 : Math.max(0.25, Math.min(1, (heatHeadroom * 0.6 + drawdownHeadroom * 0.4) / 100));
  return { allowed: reasons.length === 0, riskMultiplier: Number(riskMultiplier.toFixed(2)), reasons };
}
