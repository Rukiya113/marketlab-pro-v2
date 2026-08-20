import type { CanonicalCandle, Direction } from '@/lib/market/events';
import type {
  StructureAnalysis,
  StructureEvent,
  SwingPoint,
  XRayStructureLabel,
} from './types';

function isSwingHigh(c: CanonicalCandle[], i: number, w: number): boolean {
  const p = c[i].high;
  for (let j = i - w; j <= i + w; j += 1) {
    if (j === i || j < 0 || j >= c.length) continue;
    if (c[j].high >= p) return false;
  }
  return true;
}

function isSwingLow(c: CanonicalCandle[], i: number, w: number): boolean {
  const p = c[i].low;
  for (let j = i - w; j <= i + w; j += 1) {
    if (j === i || j < 0 || j >= c.length) continue;
    if (c[j].low <= p) return false;
  }
  return true;
}

function labelSwings(swings: SwingPoint[]): SwingPoint[] {
  let lastHigh: SwingPoint | null = null;
  let lastLow: SwingPoint | null = null;

  return swings.map((swing) => {
    let label: XRayStructureLabel | null = null;

    if (swing.type === 'HIGH') {
      if (lastHigh) label = swing.price > lastHigh.price ? 'HH' : 'LH';
      lastHigh = swing;
    } else {
      if (lastLow) label = swing.price > lastLow.price ? 'HL' : 'LL';
      lastLow = swing;
    }

    return { ...swing, label };
  });
}

export function analyzeStructure(
  candles: CanonicalCandle[],
  window = 2,
): StructureAnalysis {
  const raw: SwingPoint[] = [];

  for (let i = window; i < candles.length - window; i += 1) {
    if (isSwingHigh(candles, i, window)) {
      raw.push({
        index: i,
        time: candles[i].start,
        price: candles[i].high,
        type: 'HIGH',
        label: null,
      });
    }

    if (isSwingLow(candles, i, window)) {
      raw.push({
        index: i,
        time: candles[i].start,
        price: candles[i].low,
        type: 'LOW',
        label: null,
      });
    }
  }

  const swings = labelSwings(raw.sort((a, b) => a.index - b.index));
  const events: StructureEvent[] = [];
  let direction: Direction = 'NEUTRAL';

  const highs = swings.filter((s) => s.type === 'HIGH');
  const lows = swings.filter((s) => s.type === 'LOW');

  for (let i = 1; i < candles.length; i += 1) {
    const candle = candles[i];
    const prevHigh = [...highs].reverse().find((s) => s.index < i);
    const prevLow = [...lows].reverse().find((s) => s.index < i);

    if (prevHigh && candle.close > prevHigh.price) {
      const kind = direction === 'BEARISH' ? 'CHOCH' : 'BOS';
      direction = 'BULLISH';
      events.push({
        index: i,
        time: candle.start,
        price: candle.close,
        kind,
        direction,
        brokenSwingPrice: prevHigh.price,
      });
    }

    if (prevLow && candle.close < prevLow.price) {
      const kind = direction === 'BULLISH' ? 'CHOCH' : 'BOS';
      direction = 'BEARISH';
      events.push({
        index: i,
        time: candle.start,
        price: candle.close,
        kind,
        direction,
        brokenSwingPrice: prevLow.price,
      });
    }
  }

  return {
    direction,
    swings,
    events,
    latestLabel: swings.at(-1)?.label ?? null,
    lastSwingHigh: highs.at(-1)?.price ?? null,
    lastSwingLow: lows.at(-1)?.price ?? null,
  };
}
