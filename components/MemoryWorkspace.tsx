'use client';

import { useEffect, useState } from 'react';
import type { MemoryBucket, MemorySnapshot } from '@/lib/journal/types';
import styles from './MemoryWorkspace.module.css';

export default function MemoryWorkspace() {
  const [memory, setMemory] = useState<MemorySnapshot | null>(null);

  useEffect(() => {
    fetch('/api/journal/memory', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data: MemorySnapshot) => setMemory(data))
      .catch(() => setMemory(null));
  }, []);

  const totalWins =
    memory?.strategySummary.reduce((sum, bucket) => sum + bucket.wins, 0) ?? 0;

  return (
    <main className={styles.root}>
      <div className={styles.header}>
        <h1>ASURA MEMORY</h1>
        <p>
          Evidence-based expectancy from completed observations only. No historical edge is
          invented when the sample is empty.
        </p>
      </div>

      <div className={styles.cards}>
        <Metric label="JOURNAL ENTRIES" value={String(memory?.totalJournalEntries ?? 0)} />
        <Metric label="COMPLETED TRADES" value={String(memory?.totalTrades ?? 0)} />
        <Metric label="WINS" value={String(totalWins)} />
        <Metric
          label="STRATEGIES WITH DATA"
          value={String(memory?.strategySummary.filter((b) => b.observations > 0).length ?? 0)}
        />
      </div>

      <BucketTable
        title="STRATEGY EXPECTANCY"
        buckets={memory?.strategySummary ?? []}
      />

      <BucketTable
        title="REGIME PERFORMANCE"
        buckets={memory?.regimeSummary ?? []}
      />

      <BucketTable
        title="STRATEGY × REGIME × INSTRUMENT"
        buckets={memory?.buckets ?? []}
      />
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.card}>
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}

function BucketTable({
  title,
  buckets,
}: {
  title: string;
  buckets: MemoryBucket[];
}) {
  return (
    <section className={styles.panel}>
      <h3>{title}</h3>
      {buckets.length ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>STRATEGY</th>
              <th>REGIME</th>
              <th>INSTRUMENT</th>
              <th>N</th>
              <th>WIN RATE</th>
              <th>EXPECTANCY</th>
              <th>AVG MAE</th>
              <th>AVG MFE</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((bucket) => (
              <tr key={bucket.key}>
                <td>{bucket.strategy}</td>
                <td>{bucket.regime}</td>
                <td>{bucket.instrumentId ?? 'ALL'}</td>
                <td>{bucket.observations}</td>
                <td>{bucket.winRate == null ? '—' : `${(bucket.winRate * 100).toFixed(1)}%`}</td>
                <td>{bucket.expectancy?.toFixed(2) ?? '—'}</td>
                <td>{bucket.averageMae?.toFixed(2) ?? '—'}</td>
                <td>{bucket.averageMfe?.toFixed(2) ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.empty}>
          No completed trade observations yet. ASURA Memory will remain uncalibrated until
          real paper/live outcomes exist.
        </div>
      )}
    </section>
  );
}
