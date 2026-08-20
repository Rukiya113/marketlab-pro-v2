import type { AsuraDecision, OpportunityRecord } from './contracts';
import type { PortfolioDecision, SentinelReport } from '@/lib/risk/contracts';
export interface IntelligenceStatePayload { decision: AsuraDecision | null; opportunity: OpportunityRecord | null; sentinel: SentinelReport | null; portfolio: PortfolioDecision | null; updatedAt: number; autoExecution?: unknown; }
export function emptyIntelligenceState(): IntelligenceStatePayload { return { decision: null, opportunity: null, sentinel: null, portfolio: null, updatedAt: Date.now() }; }
