import type { CanonicalCandle } from '@/lib/market/events';
import type { ImbalanceAnalysis, ImbalanceZone } from './types';

export function analyzeImbalances(candles: CanonicalCandle[]): ImbalanceAnalysis {
  const zones: ImbalanceZone[] = [];

  for (let i = 2; i < candles.length; i += 1) {
    const a = candles[i - 2];
    const c = candles[i];

    if (a.high < c.low) {
      zones.push({
        id: `bull-fvg-${c.start}`,
        kind: 'BULLISH_FVG',
        low: a.high,
        high: c.low,
        createdAt: c.start,
        mitigatedAt: null,
        active: true,
      });
    }

    if (a.low > c.high) {
      zones.push({
        id: `bear-fvg-${c.start}`,
        kind: 'BEARISH_FVG',
        low: c.high,
        high: a.low,
        createdAt: c.start,
        mitigatedAt: null,
        active: true,
      });
    }
  }

  for (const zone of zones) {
    for (const candle of candles) {
      if (candle.start <= zone.createdAt) continue;
      if (candle.low <= zone.high && candle.high >= zone.low) {
        zone.mitigatedAt = candle.start;
        zone.active = false;
        break;
      }
    }
  }

  const last = candles.at(-1)?.close ?? null;
  const active = zones.filter((z) => z.active);

  const nearestBullish =
    active
      .filter((z) => z.kind === 'BULLISH_FVG')
      .sort((a, b) => Math.abs((last ?? a.high) - a.high) - Math.abs((last ?? b.high) - b.high))[0] ?? null;

  const nearestBearish =
    active
      .filter((z) => z.kind === 'BEARISH_FVG')
      .sort((a, b) => Math.abs((last ?? a.low) - a.low) - Math.abs((last ?? b.low) - b.low))[0] ?? null;

  return { zones, nearestBullish, nearestBearish };
}
