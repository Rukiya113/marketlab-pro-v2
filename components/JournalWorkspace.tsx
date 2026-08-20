'use client';

import { useEffect, useMemo, useState } from 'react';
import type { JournalEntry, JournalEntryKind } from '@/lib/journal/types';
import styles from './JournalWorkspace.module.css';

export default function JournalWorkspace() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [kind, setKind] = useState<'ALL' | JournalEntryKind>('ALL');

  async function refresh() {
    const url =
      kind === 'ALL'
        ? '/api/journal/entries?limit=500'
        : `/api/journal/entries?limit=500&kind=${kind}`;

    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();
    setEntries(Array.isArray(data.entries) ? data.entries : []);
  }

  useEffect(() => {
    void refresh();
  }, [kind]);

  const stats = useMemo(() => {
    const trades = entries.filter((entry) => entry.kind === 'PAPER_TRADE');
    const pnl = trades.reduce((sum, trade) => sum + (trade.pnl ?? 0), 0);
    return {
      decisions: entries.filter((entry) => entry.kind === 'ASURA_DECISION').length,
      sentinel: entries.filter((entry) => entry.kind === 'SENTINEL').length,
      trades: trades.length,
      pnl,
    };
  }, [entries]);

  return (
    <main className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1>DECISION JOURNAL</h1>
          <p>
            ASURA decisions, opportunities, Sentinel outcomes and paper-trade results.
          </p>
        </div>
        <div className={styles.controls}>
          <select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}>
            <option value="ALL">ALL EVENTS</option>
            <option value="ASURA_DECISION">ASURA DECISION</option>
            <option value="OPPORTUNITY">OPPORTUNITY</option>
            <option value="SENTINEL">SENTINEL</option>
            <option value="PORTFOLIO">PORTFOLIO</option>
            <option value="PAPER_TRADE">PAPER TRADE</option>
          </select>
          <button onClick={() => void refresh()}>REFRESH</button>
        </div>
      </div>

      <div>
        Decisions {stats.decisions} · Sentinel {stats.sentinel} · Trades {stats.trades} ·
        Net P&L {stats.pnl.toFixed(2)}
      </div>

      <section className={styles.panel}>
        {entries.length ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>TIME</th>
                <th>TYPE</th>
                <th>INSTRUMENT</th>
                <th>STRATEGY</th>
                <th>REGIME</th>
                <th>DECISION</th>
                <th>SCORE</th>
                <th>P&L</th>
                <th>DETAIL</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.createdAt).toLocaleString()}</td>
                  <td><span className={styles.kind}>{entry.kind}</span></td>
                  <td>{entry.symbol ?? entry.instrumentId ?? '—'}</td>
                  <td>{entry.strategy ?? '—'}</td>
                  <td>{entry.regime ?? '—'}</td>
                  <td>{entry.decision ?? entry.direction ?? '—'}</td>
                  <td>{entry.score ?? '—'}</td>
                  <td>{entry.pnl ?? '—'}</td>
                  <td className={styles.detail}>
                    {entry.note ??
                      entry.counterThesis[0] ??
                      (entry.tags.length ? entry.tags.join(', ') : '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.empty}>
            No journal observations yet. Historical statistics remain unavailable until
            genuine ASURA/Paper events are captured.
          </div>
        )}
      </section>
    </main>
  );
}
