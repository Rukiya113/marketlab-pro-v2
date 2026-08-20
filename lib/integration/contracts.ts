import type { CanonicalInstrumentId, Direction } from '@/lib/market/events';

export interface RuntimePolicy {
  asura: {
    minOpportunityScore: number;
    minContextScore: number;
    minSetupScore: number;
    minExecutionScore: number;
    maxUncertainty: number;
  };
  sentinel: {
    maxFeedAgeMs: number;
    maxSignalAgeMs: number;
    maxSpreadPct: number;
    minLiquidityScore: number;
    maxOptionQuoteAgeMs: number;
    minRiskReward: number;
    minExpectedValueR: number;
    cooldownMs: number;
    maxTradesPerDay: number;
  };
  portfolio: {
    riskPerTradePct: number;
    maxPortfolioHeatPct: number;
    maxDailyLossR: number;
    maxConsecutiveLosses: number;
    maxCorrelatedExposurePct: number;
  };
  options: {
    preferredAbsDeltaMin: number;
    preferredAbsDeltaMax: number;
    maxSpreadPct: number;
    minVolume: number;
    minOpenInterest: number;
    maxQuoteAgeMs: number;
    maxDistancePct: number;
  };
  paper: {
    startingCapital: number;
    slippageBps: number;
    chargeBps: number;
    maxOrderQuantity: number;
  };
  system: {
    executionMode: 'PAPER' | 'SANDBOX' | 'LIVE';
    journalCaptureEnabled: boolean;
    diagnosticsEnabled: boolean;
  };
}

export interface RuntimeMarketQuote {
  instrumentId: CanonicalInstrumentId;
  symbol: string;
  bid: number | null;
  ask: number | null;
  last: number | null;
  at: number;
}

export interface RuntimeExecutionDecision {
  instrumentId: CanonicalInstrumentId;
  direction: Direction;
  state: 'WAIT' | 'BLOCKED' | 'PAPER_READY';
  reason: string;
  at: number;
}
