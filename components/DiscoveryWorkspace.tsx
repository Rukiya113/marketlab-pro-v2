'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWorkstation } from './WorkstationProvider';
import type { DiscoveryInstrument, WatchlistItem } from '@/lib/discovery/types';
import styles from './DiscoveryWorkspace.module.css';

export default function DiscoveryWorkspace({ mode }: { mode: 'EXPLORER' | 'WATCHLIST' | 'INDICES' }) {
  const { instrumentId, setInstrumentId } = useWorkstation();
  const [catalog, setCatalog] = useState<DiscoveryInstrument[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [query, setQuery] = useState('');

  const refresh = async () => {
    const [instrumentsResponse, watchlistResponse] = await Promise.all([
      fetch('/api/discovery/instruments', { cache: 'no-store' }),
      fetch('/api/discovery/watchlist', { cache: 'no-store' }),
    ]);
    const instruments = await instrumentsResponse.json();
    const watched = await watchlistResponse.json();
    setCatalog(Array.isArray(instruments.instruments) ? instruments.instruments : []);
    setWatchlist(Array.isArray(watched.items) ? watched.items : []);
  };

  useEffect(() => { void refresh(); }, []);

  const watchedIds = useMemo(() => new Set(watchlist.map((item) => item.instrumentId)), [watchlist]);

  const visible = catalog.filter((item) => {
    if (mode === 'INDICES' && item.group !== 'INDEX') return false;
    if (mode === 'WATCHLIST' && !watchedIds.has(item.id)) return false;
    const q = query.trim().toLowerCase();
    return !q || `${item.symbol} ${item.name}`.toLowerCase().includes(q);
  });

  async function toggleWatch(item: DiscoveryInstrument) {
    if (watchedIds.has(item.id)) {
      await fetch(`/api/discovery/watchlist?instrument=${encodeURIComponent(item.id)}`, { method: 'DELETE' });
    } else {
      await fetch('/api/discovery/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instrumentId: item.id }),
      });
    }
    await refresh();
  }

  return (
    <main className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1>{mode}</h1>
          <p>Shared market discovery and selected-instrument state. Prices remain blank until canonical live data arrives.</p>
        </div>
        <input className={styles.search} placeholder="Search instruments…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h3>{mode === 'WATCHLIST' ? 'MY WATCHLIST' : 'INSTRUMENTS'}</h3>
          {visible.length ? visible.map((item) => (
            <div className={styles.row} key={item.id}>
              <div>
                <b>{item.symbol}</b>
                <div className={styles.meta}>{item.name} · {item.exchange} · {item.group}</div>
              </div>
              <button onClick={() => setInstrumentId(item.id)}>
                {instrumentId === item.id ? 'SELECTED' : 'OPEN'}
              </button>
              <button onClick={() => void toggleWatch(item)}>
                {watchedIds.has(item.id) ? '★' : '☆'}
              </button>
            </div>
          )) : <div className={styles.empty}>No instruments in this view.</div>}
        </section>

        <section className={styles.panel}>
          <h3>SELECTED MARKET</h3>
          <div className={styles.row}>
            <div>
              <b>{instrumentId}</b>
              <div className={styles.meta}>Shared with Trading, ASURA, X-RAY, Options and Scanner.</div>
            </div>
            <span>LIVE DATA</span>
            <b>—</b>
          </div>
          <div className={styles.empty}>
            Market price, change and session statistics are intentionally unavailable until the canonical feed is live.
          </div>
        </section>
      </div>
    </main>
  );
}
