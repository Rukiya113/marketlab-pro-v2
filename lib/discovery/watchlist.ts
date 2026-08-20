import type { CanonicalInstrumentId } from '@/lib/market/events';
import type { WatchlistItem } from './types';

export class WatchlistStore {
  private readonly items = new Map<CanonicalInstrumentId, WatchlistItem>();

  list(): WatchlistItem[] {
    return [...this.items.values()].sort((a, b) => a.addedAt - b.addedAt);
  }

  add(instrumentId: CanonicalInstrumentId): WatchlistItem {
    const existing = this.items.get(instrumentId);
    if (existing) return existing;
    const item = { instrumentId, addedAt: Date.now() };
    this.items.set(instrumentId, item);
    return item;
  }

  remove(instrumentId: CanonicalInstrumentId): boolean {
    return this.items.delete(instrumentId);
  }
}
