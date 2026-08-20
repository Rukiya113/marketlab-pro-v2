import type { CanonicalInstrumentId, Direction, StrategyId } from '@/lib/market/events';
export type GateResult = 'PASS' | 'WAIT' | 'FAIL';
export type SentinelDecision = 'APPROVED' | 'WAIT' | 'BLOCKED';
export interface ExecutionIntent {
  id: string; instrumentId: CanonicalInstrumentId; direction: Exclude<Direction, 'WAIT' | 'NEUTRAL'>; strategyId: StrategyId;
  createdAt: number; signalAt: number; opportunityScore: number; executionQuality: number; dataQuality: number;
  entry: number; invalidation: number; target: number; estimatedSpreadPct: number | null; estimatedSlippagePct: number | null;
  optionQuoteAgeMs: number | null; optionLiquidityScore: number | null; expectedValueR: number | null;
}
export interface SentinelContext {
  now: number; feedAgeMs: number | null; dailyPnlR: number; tradesToday: number; consecutiveLosses: number;
  lastTradeAt: number | null; duplicateIntent: boolean; maxDailyLossR: number; maxTradesPerDay: number; cooldownMs: number;
  maxFeedAgeMs: number; maxSignalAgeMs: number; maxSpreadPct: number; minLiquidityScore: number; maxOptionQuoteAgeMs: number;
  minRiskReward: number; minExpectedValueR: number;
}
export interface GateCheck { id: string; label: string; result: GateResult; reason: string; value?: number | string | boolean | null; }
export interface SentinelReport { decision: SentinelDecision; at: number; checks: GateCheck[]; reasons: string[]; }
export interface PortfolioState { equity: number; openRiskPct: number; correlatedRiskPct: number; drawdownPct: number; consecutiveLosses: number; openPositions: number; }
export interface PortfolioPolicy { maxOpenRiskPct: number; maxCorrelatedRiskPct: number; maxDrawdownPct: number; maxPositions: number; maxConsecutiveLosses: number; }
export interface PortfolioDecision { allowed: boolean; riskMultiplier: number; reasons: string[]; }
