'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  CanonicalCandle,
  CanonicalInstrumentId,
  CanonicalMarketEvent,
} from '@/lib/market/events';
import { buildXRaySnapshot } from '@/lib/xray/engine';
import type { XRaySnapshot } from '@/lib/xray/types';
import styles from './XRayWorkspace.module.css';

type Props = {
  instrumentId: CanonicalInstrumentId;
  interval?: CanonicalCandle['interval'];
};

export default function XRayWorkspace({
  instrumentId,
  interval = '5m',
}: Props) {
  const [candles, setCandles] = useState<CanonicalCandle[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);

    fetch(
      `/api/market/candles?instrument=${encodeURIComponent(instrumentId)}&interval=${interval}`,
      { cache: 'no-store' },
    )
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        setCandles(Array.isArray(data.candles) ? data.candles : []);
      })
      .catch(() => {
        if (active) {
          setCandles([]);
          setError('Canonical candle history is unavailable.');
        }
      });

    const es = new EventSource('/api/market/stream');

    es.onmessage = (event) => {
      try {
        const value = JSON.parse(event.data) as CanonicalMarketEvent;

        if (
          active &&
          value.type === 'CANDLE' &&
          value.instrumentId === instrumentId &&
          value.interval === interval
        ) {
          setCandles((previous) =>
            [...previous.filter((c) => c.start !== value.start), value]
              .sort((a, b) => a.start - b.start)
              .slice(-240),
          );
        }
      } catch {
        // Ignore malformed events.
      }
    };

    return () => {
      active = false;
      es.close();
    };
  }, [instrumentId, interval]);

  const snapshot: XRaySnapshot | null = useMemo(
    () => (candles.length >= 8 ? buildXRaySnapshot(instrumentId, candles) : null),
    [instrumentId, candles],
  );

  if (!snapshot) {
    return (
      <div className={styles.root}>
        <div className={styles.empty}>
          {error ??
            `X-RAY is waiting for enough canonical ${interval} candles. No zones or signals are fabricated.`}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.summary}>
        <Summary label="STRUCTURE" value={snapshot.structure.direction} />
        <Summary label="LAST LABEL" value={snapshot.structure.latestLabel ?? '—'} />
        <Summary
          label="ORDER FLOW"
          value={`${snapshot.orderFlow.direction} · ${snapshot.orderFlow.participation}`}
        />
        <Summary
          label="HEAT"
          value={`${snapshot.heatmap.score} · ${snapshot.heatmap.state}`}
        />
        <Summary label="CANDLES" value={String(snapshot.candleCount)} />
      </div>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h4>STRUCTURE / BOS / CHOCH</h4>
          {snapshot.structure.events
            .slice(-8)
            .reverse()
            .map((event) => (
              <div
                className={styles.row}
                key={`${event.kind}-${event.time}-${event.price}`}
              >
                <span>
                  {event.kind} · {event.direction}
                </span>
                <b>
                  {event.price.toLocaleString('en-IN', {
                    maximumFractionDigits: 2,
                  })}
                </b>
              </div>
            ))}
          {!snapshot.structure.events.length && (
            <div className={styles.empty}>No confirmed structure break yet.</div>
          )}
        </section>

        <section className={styles.panel}>
          <h4>LIQUIDITY MAP</h4>
          {snapshot.liquidity.levels
            .slice(-10)
            .reverse()
            .map((level) => (
              <div className={styles.row} key={level.id}>
                <span>
                  {level.kind}
                  {level.sweptAt ? ' · SWEPT' : ''}
                </span>
                <b>
                  {level.price.toLocaleString('en-IN', {
                    maximumFractionDigits: 2,
                  })}
                </b>
              </div>
            ))}
          {!snapshot.liquidity.levels.length && (
            <div className={styles.empty}>No mapped liquidity pools yet.</div>
          )}
        </section>

        <section className={styles.panel}>
          <h4>ORDER FLOW / DISPLACEMENT</h4>
          <div className={styles.row}>
            <span>Pressure</span>
            <b>{snapshot.orderFlow.pressure}</b>
          </div>
          <div className={styles.row}>
            <span>Direction</span>
            <b>{snapshot.orderFlow.direction}</b>
          </div>
          <div className={styles.row}>
            <span>Participation</span>
            <b>{snapshot.orderFlow.participation}</b>
          </div>
          <div className={styles.row}>
            <span>Displacement</span>
            <b>{snapshot.orderFlow.displacement.toFixed(2)}x</b>
          </div>
        </section>

        <section className={styles.panel}>
          <h4>FVG / IMBALANCES</h4>
          {snapshot.imbalances.zones
            .filter((zone) => zone.active)
            .slice(-8)
            .reverse()
            .map((zone) => (
              <div className={styles.row} key={zone.id}>
                <span>{zone.kind}</span>
                <b>
                  {zone.low.toFixed(2)} – {zone.high.toFixed(2)}
                </b>
              </div>
            ))}
          {!snapshot.imbalances.zones.some((zone) => zone.active) && (
            <div className={styles.empty}>No active imbalance zone.</div>
          )}
        </section>

        <section className={styles.panel}>
          <h4>VOLUME PROFILE</h4>
          <div className={styles.row}>
            <span>POC</span>
            <b>{snapshot.volumeProfile.poc?.toFixed(2) ?? '—'}</b>
          </div>
          <div className={styles.row}>
            <span>VAH</span>
            <b>{snapshot.volumeProfile.valueAreaHigh?.toFixed(2) ?? '—'}</b>
          </div>
          <div className={styles.row}>
            <span>VAL</span>
            <b>{snapshot.volumeProfile.valueAreaLow?.toFixed(2) ?? '—'}</b>
          </div>
        </section>

        <section className={styles.panel}>
          <h4>X-RAY HEATMAP</h4>
          {snapshot.heatmap.cells.map((cell) => (
            <div className={styles.row} key={cell.label}>
              <span>
                {cell.label} · {cell.detail}
              </span>
              <b className={styles.hot}>
                {cell.score} {cell.state}
              </b>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={styles.card}>
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}
