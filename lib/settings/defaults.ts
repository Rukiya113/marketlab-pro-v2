import type { MarketLabSettings } from './types';

export const DEFAULT_SETTINGS: MarketLabSettings = {
  version: 1,
  general: {
    theme: 'light',
    defaultInstrument: 'IN:NSE:INDEX:NIFTY50',
    defaultTimeframe: '5m',
  },
  asura: {
    minOpportunityScore: 70,
    minContextScore: 60,
    minSetupScore: 65,
    minExecutionScore: 70,
    maxUncertainty: 35,
  },
  strategies: {
    trendPullbackEnabled: true,
    liquiditySweepEnabled: true,
    breakoutRetestEnabled: true,
    minStrategyScore: 65,
  },
  sentinel: {
    maxFeedAgeMs: 5_000,
    maxSignalAgeMs: 90_000,
    maxSpreadPct: 2,
    minLiquidityScore: 60,
    maxOptionQuoteAgeMs: 15_000,
    minRiskReward: 1.2,
    minExpectedValueR: 0.05,
    cooldownMs: 180_000,
    maxTradesPerDay: 8,
  },
  portfolio: {
    riskPerTradePct: 0.5,
    maxPortfolioHeatPct: 2,
    maxDailyLossR: 3,
    maxConsecutiveLosses: 3,
    maxCorrelatedExposurePct: 40,
  },
  options: {
    preferredAbsDeltaMin: 0.3,
    preferredAbsDeltaMax: 0.7,
    maxSpreadPct: 2,
    minVolume: 1,
    minOpenInterest: 1,
    maxQuoteAgeMs: 15_000,
    maxDistancePct: 2,
  },
  paper: {
    startingCapital: 1_000_000,
    slippageBps: 2,
    chargeBps: 3,
    maxOrderQuantity: 100_000,
  },
  system: {
    executionMode: 'PAPER',
    autoExecutionEnabled: false,
    emergencyKillSwitch: true,
    journalCaptureEnabled: true,
    diagnosticsEnabled: true,
  },
};
