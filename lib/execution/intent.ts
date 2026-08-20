import { randomUUID } from 'node:crypto';
import type { AsuraDecision, OpportunityRecord } from '@/lib/intelligence/contracts';
import type { ExecutionIntent } from '@/lib/risk/contracts';
export function createExecutionIntent(decision: AsuraDecision, opportunity: OpportunityRecord): ExecutionIntent | null {
  if (decision.state !== 'READY' || opportunity.state !== 'READY' || !decision.competition.selected) return null;
  if (decision.direction !== 'BULLISH' && decision.direction !== 'BEARISH') return null;
  if (!decision.entryZone || decision.invalidation == null || !decision.targets.length) return null;
  return {
    id: randomUUID(), instrumentId: decision.instrumentId, direction: decision.direction, strategyId: decision.competition.selected.id,
    createdAt: Date.now(), signalAt: decision.at, opportunityScore: decision.opportunityScore, executionQuality: decision.executionQuality,
    dataQuality: decision.dataQuality, entry: (decision.entryZone[0] + decision.entryZone[1]) / 2,
    invalidation: decision.invalidation, target: decision.targets[0], estimatedSpreadPct: null, estimatedSlippagePct: null,
    optionQuoteAgeMs: null, optionLiquidityScore: null, expectedValueR: decision.netExpectedValueR,
  };
}
