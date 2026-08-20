import type { CanonicalCandle } from '@/lib/market/events';
import type { LiquidityAnalysis, LiquidityLevel, StructureAnalysis } from './types';

const EPSILON_PCT = 0.08;

function near(a: number, b: number): boolean {
  return Math.abs(a - b) / Math.max(Math.abs(b), 1) * 100 <= EPSILON_PCT;
}

export function analyzeLiquidity(
  candles: CanonicalCandle[],
  structure: StructureAnalysis,
): LiquidityAnalysis {
  const levels: LiquidityLevel[] = [];
  const recent = candles.slice(-80);

  const sessionHigh = recent.length ? Math.max(...recent.map((c) => c.high)) : null;
  const sessionLow = recent.length ? Math.min(...recent.map((c) => c.low)) : null;

  if (sessionHigh != null) {
    levels.push({
      id: `session-high-${sessionHigh}`,
      kind: 'SESSION_HIGH',
      price: sessionHigh,
      createdAt: recent.find((c) => c.high === sessionHigh)?.start ?? Date.now(),
      touchedAt: null,
      sweptAt: null,
      strength: 80,
      active: true,
    });
  }

  if (sessionLow != null) {
    levels.push({
      id: `session-low-${sessionLow}`,
      kind: 'SESSION_LOW',
      price: sessionLow,
      createdAt: recent.find((c) => c.low === sessionLow)?.start ?? Date.now(),
      touchedAt: null,
      sweptAt: null,
      strength: 80,
      active: true,
    });
  }

  const highs = structure.swings.filter((s) => s.type === 'HIGH');
  const lows = structure.swings.filter((s) => s.type === 'LOW');

  for (let i = 1; i < highs.length; i += 1) {
    if (near(highs[i - 1].price, highs[i].price)) {
      levels.push({
        id: `eqh-${highs[i].time}`,
        kind: 'EQUAL_HIGHS',
        price: (highs[i - 1].price + highs[i].price) / 2,
        createdAt: highs[i].time,
        touchedAt: null,
        sweptAt: null,
        strength: 90,
        active: true,
      });
    }
  }

  for (let i = 1; i < lows.length; i += 1) {
    if (near(lows[i - 1].price, lows[i].price)) {
      levels.push({
        id: `eql-${lows[i].time}`,
        kind: 'EQUAL_LOWS',
        price: (lows[i - 1].price + lows[i].price) / 2,
        createdAt: lows[i].time,
        touchedAt: null,
        sweptAt: null,
        strength: 90,
        active: true,
      });
    }
  }

  for (const high of highs.slice(-8)) {
    levels.push({
      id: `bsl-${high.time}`,
      kind: 'BUY_SIDE',
      price: high.price,
      createdAt: high.time,
      touchedAt: null,
      sweptAt: null,
      strength: 60,
      active: true,
    });
  }

  for (const low of lows.slice(-8)) {
    levels.push({
      id: `ssl-${low.time}`,
      kind: 'SELL_SIDE',
      price: low.price,
      createdAt: low.time,
      touchedAt: null,
      sweptAt: null,
      strength: 60,
      active: true,
    });
  }

  const last = candles.at(-1);

  if (last) {
    for (const level of levels) {
      const buySide = ['BUY_SIDE', 'EQUAL_HIGHS', 'SESSION_HIGH'].includes(level.kind);
      const sellSide = ['SELL_SIDE', 'EQUAL_LOWS', 'SESSION_LOW'].includes(level.kind);

      if (buySide && last.high > level.price && last.close < level.price) {
        level.sweptAt = last.start;
        level.active = false;
      }

      if (sellSide && last.low < level.price && last.close > level.price) {
        level.sweptAt = last.start;
        level.active = false;
      }
    }
  }

  const price = last?.close ?? null;

  const activeBuy = levels
    .filter((l) => l.active && ['BUY_SIDE', 'EQUAL_HIGHS', 'SESSION_HIGH'].includes(l.kind))
    .sort((a, b) => Math.abs((price ?? a.price) - a.price) - Math.abs((price ?? b.price) - b.price));

  const activeSell = levels
    .filter((l) => l.active && ['SELL_SIDE', 'EQUAL_LOWS', 'SESSION_LOW'].includes(l.kind))
    .sort((a, b) => Math.abs((price ?? a.price) - a.price) - Math.abs((price ?? b.price) - b.price));

  return {
    levels,
    nearestBuySide: activeBuy[0] ?? null,
    nearestSellSide: activeSell[0] ?? null,
    recentSweep: [...levels].reverse().find((l) => l.sweptAt != null) ?? null,
  };
}
