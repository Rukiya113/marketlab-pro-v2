import { WatchlistStore } from './watchlist';

declare global {
  var __marketLabWatchlist: WatchlistStore | undefined;
}

export const watchlistStore =
  globalThis.__marketLabWatchlist ??
  (globalThis.__marketLabWatchlist = new WatchlistStore());
