import type { AsuraDecision, OpportunityRecord } from './contracts';
import type { SentinelReport, PortfolioDecision } from '@/lib/risk/contracts';

export interface DecisionLedgerEntry {
  id: string;
  instrumentId: string;
  at: number;
  direction: string;
  strategy: string | null;
  opportunityScore: number;
  opportunityState: string | null;
  sentinelDecision: string | null;
  portfolioAllowed: boolean | null;
  evidence: string[];
  counterThesis: string[];
  version: string;
}

export function createDecisionLedgerEntry(
  decision: AsuraDecision,
  opportunity: OpportunityRecord | null,
  sentinel: SentinelReport | null,
  portfolio: PortfolioDecision | null,
  version = 'asura-v2',
): DecisionLedgerEntry {
  return {
    id: `${decision.instrumentId}:${decision.at}`,
    instrumentId: decision.instrumentId,
    at: decision.at,
    direction: decision.direction,
    strategy: decision.competition.selected?.id ?? null,
    opportunityScore: decision.opportunityScore,
    opportunityState: opportunity?.state ?? null,
    sentinelDecision: sentinel?.decision ?? null,
    portfolioAllowed: portfolio?.allowed ?? null,
    evidence: decision.evidence.filter((item) => item.status === 'PASS').slice(0, 12).map((item) => item.reason),
    counterThesis: decision.counterThesis.slice(0, 12),
    version,
  };
}
