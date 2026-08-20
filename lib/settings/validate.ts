import { DEFAULT_SETTINGS } from './defaults';
import type { MarketLabSettings } from './types';

function finite(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function normalizeSettings(value: Partial<MarketLabSettings>): MarketLabSettings {
  const d = DEFAULT_SETTINGS;

  return {
    version: 1,
    general: {
      theme: value.general?.theme ?? d.general.theme,
      defaultInstrument:
        value.general?.defaultInstrument?.trim() || d.general.defaultInstrument,
      defaultTimeframe: value.general?.defaultTimeframe ?? d.general.defaultTimeframe,
    },
    asura: {
      minOpportunityScore: finite(value.asura?.minOpportunityScore, d.asura.minOpportunityScore, 0, 100),
      minContextScore: finite(value.asura?.minContextScore, d.asura.minContextScore, 0, 100),
      minSetupScore: finite(value.asura?.minSetupScore, d.asura.minSetupScore, 0, 100),
      minExecutionScore: finite(value.asura?.minExecutionScore, d.asura.minExecutionScore, 0, 100),
      maxUncertainty: finite(value.asura?.maxUncertainty, d.asura.maxUncertainty, 0, 100),
    },
    strategies: {
      trendPullbackEnabled: bool(value.strategies?.trendPullbackEnabled, d.strategies.trendPullbackEnabled),
      liquiditySweepEnabled: bool(value.strategies?.liquiditySweepEnabled, d.strategies.liquiditySweepEnabled),
      breakoutRetestEnabled: bool(value.strategies?.breakoutRetestEnabled, d.strategies.breakoutRetestEnabled),
      minStrategyScore: finite(value.strategies?.minStrategyScore, d.strategies.minStrategyScore, 0, 100),
    },
    sentinel: {
      maxFeedAgeMs: finite(value.sentinel?.maxFeedAgeMs, d.sentinel.maxFeedAgeMs, 500, 120_000),
      maxSignalAgeMs: finite(value.sentinel?.maxSignalAgeMs, d.sentinel.maxSignalAgeMs, 1_000, 900_000),
      maxSpreadPct: finite(value.sentinel?.maxSpreadPct, d.sentinel.maxSpreadPct, 0.01, 20),
      minLiquidityScore: finite(value.sentinel?.minLiquidityScore, d.sentinel.minLiquidityScore, 0, 100),
      maxOptionQuoteAgeMs: finite(value.sentinel?.maxOptionQuoteAgeMs, d.sentinel.maxOptionQuoteAgeMs, 500, 120_000),
      minRiskReward: finite(value.sentinel?.minRiskReward, d.sentinel.minRiskReward, 0, 10),
      minExpectedValueR: finite(value.sentinel?.minExpectedValueR, d.sentinel.minExpectedValueR, -5, 10),
      cooldownMs: finite(value.sentinel?.cooldownMs, d.sentinel.cooldownMs, 0, 3_600_000),
      maxTradesPerDay: finite(value.sentinel?.maxTradesPerDay, d.sentinel.maxTradesPerDay, 1, 100),
    },
    portfolio: {
      riskPerTradePct: finite(value.portfolio?.riskPerTradePct, d.portfolio.riskPerTradePct, 0.01, 10),
      maxPortfolioHeatPct: finite(value.portfolio?.maxPortfolioHeatPct, d.portfolio.maxPortfolioHeatPct, 0.1, 50),
      maxDailyLossR: finite(value.portfolio?.maxDailyLossR, d.portfolio.maxDailyLossR, 0.1, 20),
      maxConsecutiveLosses: finite(value.portfolio?.maxConsecutiveLosses, d.portfolio.maxConsecutiveLosses, 1, 20),
      maxCorrelatedExposurePct: finite(value.portfolio?.maxCorrelatedExposurePct, d.portfolio.maxCorrelatedExposurePct, 1, 100),
    },
    options: {
      preferredAbsDeltaMin: finite(value.options?.preferredAbsDeltaMin, d.options.preferredAbsDeltaMin, 0, 1),
      preferredAbsDeltaMax: finite(value.options?.preferredAbsDeltaMax, d.options.preferredAbsDeltaMax, 0, 1),
      maxSpreadPct: finite(value.options?.maxSpreadPct, d.options.maxSpreadPct, 0.01, 20),
      minVolume: finite(value.options?.minVolume, d.options.minVolume, 0, 10_000_000),
      minOpenInterest: finite(value.options?.minOpenInterest, d.options.minOpenInterest, 0, 100_000_000),
      maxQuoteAgeMs: finite(value.options?.maxQuoteAgeMs, d.options.maxQuoteAgeMs, 500, 120_000),
      maxDistancePct: finite(value.options?.maxDistancePct, d.options.maxDistancePct, 0.1, 20),
    },
    paper: {
      startingCapital: finite(value.paper?.startingCapital, d.paper.startingCapital, 1_000, 1_000_000_000),
      slippageBps: finite(value.paper?.slippageBps, d.paper.slippageBps, 0, 500),
      chargeBps: finite(value.paper?.chargeBps, d.paper.chargeBps, 0, 500),
      maxOrderQuantity: finite(value.paper?.maxOrderQuantity, d.paper.maxOrderQuantity, 1, 100_000_000),
    },
    system: {
      executionMode: value.system?.executionMode ?? d.system.executionMode,
      autoExecutionEnabled: bool(value.system?.autoExecutionEnabled, d.system.autoExecutionEnabled),
      emergencyKillSwitch: bool(value.system?.emergencyKillSwitch, d.system.emergencyKillSwitch),
      journalCaptureEnabled: bool(value.system?.journalCaptureEnabled, d.system.journalCaptureEnabled),
      diagnosticsEnabled: bool(value.system?.diagnosticsEnabled, d.system.diagnosticsEnabled),
    },
  };
}
