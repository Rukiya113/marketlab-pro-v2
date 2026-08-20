import type { CanonicalInstrumentId } from '@/lib/market/events';

export type JournalEntryKind =
  | 'ASURA_DECISION'
  | 'OPPORTUNITY'
  | 'SENTINEL'
  | 'PORTFOLIO'
  | 'PAPER_ORDER'
  | 'PAPER_FILL'
  | 'PAPER_TRADE'
  | 'NOTE';

export interface JournalEvidence {
  label: string;
  value: string | number | boolean | null;
  source: string;
}

export interface JournalEntry {
  id: string;
  kind: JournalEntryKind;
  instrumentId: CanonicalInstrumentId | null;
  symbol: string | null;
  strategy: string | null;
  regime: string | null;
  direction: string | null;
  opportunityId: string | null;
  paperOrderId: string | null;
  paperTradeId: string | null;
  decision: string | null;
  score: number | null;
  pnl: number | null;
  mae: number | null;
  mfe: number | null;
  dataQuality: number | null;
  evidence: JournalEvidence[];
  counterThesis: string[];
  tags: string[];
  note: string | null;
  payload: unknown;
  createdAt: number;
}

export interface JournalQuery {
  instrumentId?: CanonicalInstrumentId;
  strategy?: string;
  kind?: JournalEntryKind;
  from?: number;
  to?: number;
  limit?: number;
}

export interface MemoryBucket {
  key: string;
  strategy: string;
  regime: string;
  instrumentId: CanonicalInstrumentId | null;
  observations: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number | null;
  averagePnl: number | null;
  averageMae: number | null;
  averageMfe: number | null;
  expectancy: number | null;
  updatedAt: number;
}

export interface MemorySnapshot {
  generatedAt: number;
  totalJournalEntries: number;
  totalTrades: number;
  buckets: MemoryBucket[];
  strategySummary: MemoryBucket[];
  regimeSummary: MemoryBucket[];
}
