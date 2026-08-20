'use client';

import { useEffect, useState } from 'react';
import { useWorkstation } from './WorkstationProvider';
import type { SystemPulseSnapshot } from '@/lib/diagnostics/types';
import styles from './DiagnosticsWorkspace.module.css';

export default function DiagnosticsWorkspace() {
  const { instrumentId } = useWorkstation();
  const [pulse, setPulse] = useState<SystemPulseSnapshot | null>(null);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      try {
        const response = await fetch(
          `/api/diagnostics/pulse?instrument=${encodeURIComponent(instrumentId)}`,
          { cache: 'no-store' },
        );
        const data = await response.json() as SystemPulseSnapshot;
        if (active) setPulse(data);
      } catch {
        if (active) setPulse(null);
      }
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), 2000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [instrumentId]);

  return (
    <main className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1>DIAGNOSTICS / SYSTEM PULSE</h1>
          <p>{instrumentId} · runtime health, freshness and execution readiness</p>
        </div>
        <span className={styles.overall}>
          {pulse?.overall ?? 'UNKNOWN'}
        </span>
      </div>

      <div className={styles.cards}>
        <Metric
          label="ANALYSIS READY"
          value={pulse?.readyForAnalysis ? 'YES' : 'NO'}
        />
        <Metric
          label="PAPER EXECUTION READY"
          value={pulse?.readyForPaperExecution ? 'YES' : 'NO'}
        />
        <Metric
          label="BLOCKERS"
          value={String(pulse?.blockers.length ?? 0)}
        />
        <Metric
          label="LAST REFRESH"
          value={
            pulse
              ? new Date(pulse.generatedAt).toLocaleTimeString()
              : '—'
          }
        />
      </div>

      <section className={styles.panel}>
        <h3>ENGINE HEALTH</h3>
        {pulse?.components.length ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>COMPONENT</th>
                <th>STATE</th>
                <th>DETAIL</th>
                <th>AGE</th>
                <th>LATENCY</th>
                <th>BLOCKING</th>
              </tr>
            </thead>
            <tbody>
              {pulse.components.map((component) => (
                <tr key={component.id}>
                  <td>{component.label}</td>
                  <td><b>{component.state}</b></td>
                  <td>{component.detail}</td>
                  <td>{formatAge(component.ageMs)}</td>
                  <td>{component.latencyMs == null ? '—' : `${component.latencyMs} ms`}</td>
                  <td>{component.blocking ? 'YES' : 'NO'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.empty}>Diagnostics state unavailable.</div>
        )}
      </section>

      <section className={styles.panel}>
        <h3>ACTIVE BLOCKERS</h3>
        <div className={styles.blockers}>
          {pulse?.blockers.length ? (
            pulse.blockers.map((blocker) => (
              <div className={styles.blocker} key={blocker}>{blocker}</div>
            ))
          ) : (
            <div className={styles.empty}>No blocking condition reported.</div>
          )}
        </div>
      </section>
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

function formatAge(age: number | null): string {
  if (age == null) return '—';
  if (age < 1000) return `${age} ms`;
  if (age < 60_000) return `${(age / 1000).toFixed(1)} s`;
  return `${(age / 60_000).toFixed(1)} min`;
}
