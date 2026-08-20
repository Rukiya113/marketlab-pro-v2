import type { CanonicalInstrumentId } from '@/lib/market/events';

export type DiscoveryGroup = 'INDEX' | 'SECTOR' | 'STOCK';

export interface DiscoveryInstrument {
  id: CanonicalInstrumentId;
  symbol: string;
  name: string;
  group: DiscoveryGroup;
  exchange: string;
}

export interface DiscoveryQuote {
  instrumentId: CanonicalInstrumentId;
  last: number | null;
  change: number | null;
  changePct: number | null;
  at: number | null;
  state: 'LIVE' | 'STALE' | 'OFFLINE';
}

export interface WatchlistItem {
  instrumentId: CanonicalInstrumentId;
  addedAt: number;
}
