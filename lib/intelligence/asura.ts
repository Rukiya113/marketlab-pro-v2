import type { CanonicalInstrumentId } from '@/lib/market/events';
import type { AsuraDecision, EvidenceItem } from './contracts';
import type { FeatureStore } from './features';
import { runContextBrain } from './brains/context';
import { runSetupBrain } from './brains/setup';
import { runExecutionBrain } from './brains/execution';
import { runStrategyCompetition } from './strategies/competition';
import { clamp, weightedScore } from './math';

export interface AsuraPolicy {
  minimumDataQuality: number;
  minimumOpportunityScore: number;
  maxUncertainty: number;
}
export const DEFAULT_ASURA_POLICY: AsuraPolicy = { minimumDataQuality: 80, minimumOpportunityScore: 55, maxUncertainty: 55 };

export function analyzeAsura(instrumentId: CanonicalInstrumentId, store: FeatureStore, dataQuality: number, policy: AsuraPolicy = DEFAULT_ASURA_POLICY, now = Date.now()): AsuraDecision | null {
  const context = runContextBrain(instrumentId, store);
  const setup = runSetupBrain(instrumentId, store, context);
  const execution = runExecutionBrain(instrumentId, store, setup, now);
  if (context.state === 'INSUFFICIENT_DATA') return null;
  const competition = runStrategyCompetition({ context, setup, execution });
  const selected = competition.selected;
  const direction = selected?.direction ?? context.direction;
  const setupQuality = selected ? weightedScore([[setup.setupQuality, 0.55], [selected.setupScore, 0.45]]) : setup.setupQuality;
  const locationQuality = setup.locationQuality;
  const executionQuality = execution.executionQuality;
  const riskQuality = clamp(100 - context.contradictionScore * 0.45 - Math.max(0, 80 - dataQuality) * 1.2);
  const directionProbability = context.probability;
  const uncertainty = clamp(100 - weightedScore([[directionProbability, 0.25], [setupQuality, 0.25], [executionQuality, 0.2], [dataQuality, 0.2], [riskQuality, 0.1]]));
  const opportunityScore = weightedScore([[directionProbability, 0.20], [setupQuality, 0.25], [locationQuality, 0.15], [executionQuality, 0.20], [dataQuality, 0.10], [riskQuality, 0.10]]) - uncertainty * 0.15;
  const f5 = store.get(instrumentId, '5m');
  const last = f5?.close ?? null;
  const atr = f5?.atr14 ?? 0;
  const bullish = direction === 'BULLISH';
  const entryZone: [number, number] | null = last != null && atr > 0 && (bullish || direction === 'BEARISH') ? [last - atr * 0.12, last + atr * 0.12] : null;
  const invalidation = last != null && atr > 0 && (bullish || direction === 'BEARISH') ? (bullish ? last - atr * 0.85 : last + atr * 0.85) : null;
  const targets = last != null && atr > 0 && (bullish || direction === 'BEARISH') ? [bullish ? last + atr : last - atr, bullish ? last + atr * 1.7 : last - atr * 1.7] : [];
  const waitingFor: string[] = [];
  if (!selected) waitingFor.push('eligible strategy');
  if (setup.state !== 'READY') waitingFor.push('5m setup quality');
  if (execution.state !== 'READY') waitingFor.push(...execution.blockers.slice(0, 2));
  if (dataQuality < policy.minimumDataQuality) waitingFor.push('healthy data quality');
  if (uncertainty > policy.maxUncertainty) waitingFor.push('lower uncertainty');
  const evidence: EvidenceItem[] = [...context.evidence, ...setup.evidence, ...execution.evidence, ...(selected?.evidence ?? [])];
  const state = dataQuality < policy.minimumDataQuality ? 'WAIT' : selected && setup.state === 'READY' && execution.state === 'READY' && opportunityScore >= policy.minimumOpportunityScore && uncertainty <= policy.maxUncertainty ? 'READY' : 'WAIT';
  return {
    instrumentId, at: now, state, direction, directionProbability: Math.round(directionProbability), regime: context.regime.regime,
    context, setup, execution, competition,
    setupQuality: Math.round(setupQuality), locationQuality: Math.round(locationQuality), executionQuality: Math.round(executionQuality),
    dataQuality: Math.round(clamp(dataQuality)), riskQuality: Math.round(riskQuality), uncertainty: Math.round(uncertainty), opportunityScore: Math.round(clamp(opportunityScore)),
    historicalExpectancyR: null, netExpectedValueR: null, optionsQuality: null,
    entryZone, invalidation, targets, evidence,
    counterThesis: [...context.counterThesis, ...setup.invalidationReasons, ...execution.blockers], waitingFor,
    summary: state === 'READY' ? `${selected?.label ?? 'Strategy'} is ready for Sentinel review.` : `ASURA is waiting for ${waitingFor[0] ?? 'additional evidence'}.`,
  };
}
