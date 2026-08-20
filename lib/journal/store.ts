import { randomUUID } from 'node:crypto';
import type { CanonicalInstrumentId } from '@/lib/market/events';
import type {
  JournalEntry,
  JournalEntryKind,
  JournalEvidence,
  JournalQuery,
} from './types';

type NewJournalEntry = {
  kind: JournalEntryKind;
  instrumentId?: CanonicalInstrumentId | null;
  symbol?: string | null;
  strategy?: string | null;
  regime?: string | null;
  direction?: string | null;
  opportunityId?: string | null;
  paperOrderId?: string | null;
  paperTradeId?: string | null;
  decision?: string | null;
  score?: number | null;
  pnl?: number | null;
  mae?: number | null;
  mfe?: number | null;
  dataQuality?: number | null;
  evidence?: JournalEvidence[];
  counterThesis?: string[];
  tags?: string[];
  note?: string | null;
  payload?: unknown;
  createdAt?: number;
};

const MAX_ENTRIES = 10_000;

export class JournalStore {
  private readonly entries: JournalEntry[] = [];

  append(input: NewJournalEntry): JournalEntry {
    const entry: JournalEntry = {
      id: randomUUID(),
      kind: input.kind,
      instrumentId: input.instrumentId ?? null,
      symbol: input.symbol ?? null,
      strategy: input.strategy ?? null,
      regime: input.regime ?? null,
      direction: input.direction ?? null,
      opportunityId: input.opportunityId ?? null,
      paperOrderId: input.paperOrderId ?? null,
      paperTradeId: input.paperTradeId ?? null,
      decision: input.decision ?? null,
      score: input.score ?? null,
      pnl: input.pnl ?? null,
      mae: input.mae ?? null,
      mfe: input.mfe ?? null,
      dataQuality: input.dataQuality ?? null,
      evidence: input.evidence ?? [],
      counterThesis: input.counterThesis ?? [],
      tags: input.tags ?? [],
      note: input.note ?? null,
      payload: input.payload ?? null,
      createdAt: input.createdAt ?? Date.now(),
    };

    this.entries.unshift(entry);

    if (this.entries.length > MAX_ENTRIES) {
      this.entries.length = MAX_ENTRIES;
    }

    return structuredClone(entry);
  }

  list(query: JournalQuery = {}): JournalEntry[] {
    const limit = Math.max(1, Math.min(query.limit ?? 250, 1000));

    return this.entries
      .filter((entry) => {
        if (query.instrumentId && entry.instrumentId !== query.instrumentId) {
          return false;
        }

        if (query.strategy && entry.strategy !== query.strategy) {
          return false;
        }

        if (query.kind && entry.kind !== query.kind) {
          return false;
        }

        if (query.from && entry.createdAt < query.from) {
          return false;
        }

        if (query.to && entry.createdAt > query.to) {
          return false;
        }

        return true;
      })
      .slice(0, limit)
      .map((entry) => structuredClone(entry));
  }

  all(): JournalEntry[] {
    return this.entries.map((entry) => structuredClone(entry));
  }

  clear(): void {
    this.entries.splice(0, this.entries.length);
  }
}
