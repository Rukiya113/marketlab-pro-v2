import { randomUUID } from 'node:crypto';
import type { AsuraDecision, OpportunityLifecycleState, OpportunityRecord } from './contracts';

export interface OpportunityPolicy {
  discoverScore: number;
  armScore: number;
  triggerScore: number;
  readyScore: number;
  ttlMs: number;
}

export const DEFAULT_OPPORTUNITY_POLICY: OpportunityPolicy = { discoverScore: 50, armScore: 65, triggerScore: 75, readyScore: 82, ttlMs: 5 * 60_000 };

export class OpportunityEngine {
  private readonly records = new Map<string, OpportunityRecord>();

  update(decision: AsuraDecision, policy: OpportunityPolicy = DEFAULT_OPPORTUNITY_POLICY): OpportunityRecord | null {
    if (decision.direction !== 'BULLISH' && decision.direction !== 'BEARISH') return null;
    const key = decision.instrumentId;
    const current = this.records.get(key);
    const now = decision.at;
    let state: OpportunityLifecycleState = 'DISCOVERED';
    if (decision.opportunityScore >= policy.discoverScore) state = 'WATCHING';
    if (decision.opportunityScore >= policy.armScore && decision.setup.state === 'READY') state = 'ARMED';
    if (decision.opportunityScore >= policy.triggerScore && decision.execution.triggerQuality >= 65) state = 'TRIGGERED';
    if (decision.opportunityScore >= policy.readyScore && decision.execution.state === 'READY') state = 'READY';
    if (decision.setup.invalidationReasons.length) state = 'INVALIDATED';
    const record: OpportunityRecord = {
      id: current?.id ?? randomUUID(), instrumentId: decision.instrumentId, strategyId: decision.competition.selected?.id ?? null,
      direction: decision.direction, state, score: decision.opportunityScore,
      createdAt: current?.createdAt ?? now, updatedAt: now, validUntil: now + policy.ttlMs,
      entryZone: decision.entryZone, invalidation: decision.invalidation, targets: decision.targets,
      reasons: decision.evidence.filter((item) => item.status === 'PASS').slice(0, 8).map((item) => item.reason),
      invalidationReasons: decision.setup.invalidationReasons,
    };
    this.records.set(key, record);
    return record;
  }

  expire(now = Date.now()): OpportunityRecord[] {
    const changed: OpportunityRecord[] = [];
    for (const [key, record] of this.records) {
      if (!['READY', 'INVALIDATED', 'CLOSED', 'EXPIRED'].includes(record.state) && record.validUntil < now) {
        const next = { ...record, state: 'EXPIRED' as const, updatedAt: now };
        this.records.set(key, next); changed.push(next);
      }
    }
    return changed;
  }

  get(instrumentId: string): OpportunityRecord | null { return this.records.get(instrumentId) ?? null; }
  list(): OpportunityRecord[] { return [...this.records.values()].sort((a, b) => b.score - a.score); }
}
