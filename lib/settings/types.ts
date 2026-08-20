export type ExecutionMode = 'PAPER' | 'SANDBOX' | 'LIVE';
export type SettingsTheme = 'light' | 'professional' | 'soft' | 'dark';
export interface MarketLabSettings {
  version: 1;
  general: { theme: SettingsTheme; defaultInstrument: string; defaultTimeframe: '1m'|'3m'|'5m'|'15m'|'30m'|'1h' };
  asura: { minOpportunityScore:number; minContextScore:number; minSetupScore:number; minExecutionScore:number; maxUncertainty:number };
  strategies: { trendPullbackEnabled:boolean; liquiditySweepEnabled:boolean; breakoutRetestEnabled:boolean; minStrategyScore:number };
  sentinel: { maxFeedAgeMs:number; maxSignalAgeMs:number; maxSpreadPct:number; minLiquidityScore:number; maxOptionQuoteAgeMs:number; minRiskReward:number; minExpectedValueR:number; cooldownMs:number; maxTradesPerDay:number };
  portfolio: { riskPerTradePct:number; maxPortfolioHeatPct:number; maxDailyLossR:number; maxConsecutiveLosses:number; maxCorrelatedExposurePct:number };
  options: { preferredAbsDeltaMin:number; preferredAbsDeltaMax:number; maxSpreadPct:number; minVolume:number; minOpenInterest:number; maxQuoteAgeMs:number; maxDistancePct:number };
  paper: { startingCapital:number; slippageBps:number; chargeBps:number; maxOrderQuantity:number };
  system: { executionMode:ExecutionMode; autoExecutionEnabled:boolean; emergencyKillSwitch:boolean; journalCaptureEnabled:boolean; diagnosticsEnabled:boolean };
}
export interface SettingsEnvelope { settings:MarketLabSettings; updatedAt:number; source:'DEFAULT'|'MEMORY' }
