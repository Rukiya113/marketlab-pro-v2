import type { CanonicalInstrumentId } from '@/lib/market/events';
import type {
  JournalEntry,
  MemoryBucket,
  MemorySnapshot,
} from './types';

type MutableBucket = {
  key: string;
  strategy: string;
  regime: string;
  instrumentId: CanonicalInstrumentId | null;
  pnl: number[];
  mae: number[];
  mfe: number[];
  updatedAt: number;
};

function summarize(bucket: MutableBucket): MemoryBucket {
  const observations = bucket.pnl.length;
  const wins = bucket.pnl.filter((value) => value > 0).length;
  const losses = bucket.pnl.filter((value) => value < 0).length;
  const breakeven = observations - wins - losses;

  const average = (values: number[]): number | null =>
    values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null;

  const averagePnl = average(bucket.pnl);

  return {
    key: bucket.key,
    strategy: bucket.strategy,
    regime: bucket.regime,
    instrumentId: bucket.instrumentId,
    observations,
    wins,
    losses,
    breakeven,
    winRate: observations ? wins / observations : null,
    averagePnl,
    averageMae: average(bucket.mae),
    averageMfe: average(bucket.mfe),
    expectancy: averagePnl,
    updatedAt: bucket.updatedAt,
  };
}

function aggregate(
  entries: JournalEntry[],
  keyFn: (entry: JournalEntry) => {
    key: string;
    strategy: string;
    regime: string;
    instrumentId: CanonicalInstrumentId | null;
  },
): MemoryBucket[] {
  const buckets = new Map<string, MutableBucket>();

  for (const entry of entries) {
    if (entry.kind !== 'PAPER_TRADE' || entry.pnl == null) continue;

    const meta = keyFn(entry);
    const bucket = buckets.get(meta.key) ?? {
      ...meta,
      pnl: [],
      mae: [],
      mfe: [],
      updatedAt: entry.createdAt,
    };

    bucket.pnl.push(entry.pnl);

    if (entry.mae != null) bucket.mae.push(entry.mae);
    if (entry.mfe != null) bucket.mfe.push(entry.mfe);

    bucket.updatedAt = Math.max(bucket.updatedAt, entry.createdAt);
    buckets.set(meta.key, bucket);
  }

  return [...buckets.values()]
    .map(summarize)
    .sort((a, b) => b.observations - a.observations);
}

export function buildMemory(entries: JournalEntry[]): MemorySnapshot {
  const trades = entries.filter((entry) => entry.kind === 'PAPER_TRADE');

  const buckets = aggregate(entries, (entry) => ({
    key: `${entry.strategy ?? 'UNSPECIFIED'}|${entry.regime ?? 'UNKNOWN'}|${entry.instrumentId ?? 'UNKNOWN'}`,
    strategy: entry.strategy ?? 'UNSPECIFIED',
    regime: entry.regime ?? 'UNKNOWN',
    instrumentId: entry.instrumentId,
  }));

  const strategySummary = aggregate(entries, (entry) => ({
    key: `STRATEGY|${entry.strategy ?? 'UNSPECIFIED'}`,
    strategy: entry.strategy ?? 'UNSPECIFIED',
    regime: 'ALL',
    instrumentId: null,
  }));

  const regimeSummary = aggregate(entries, (entry) => ({
    key: `REGIME|${entry.regime ?? 'UNKNOWN'}`,
    strategy: 'ALL',
    regime: entry.regime ?? 'UNKNOWN',
    instrumentId: null,
  }));

  return {
    generatedAt: Date.now(),
    totalJournalEntries: entries.length,
    totalTrades: trades.length,
    buckets,
    strategySummary,
    regimeSummary,
  };
}
