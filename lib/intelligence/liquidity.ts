import type { CanonicalCandle } from '@/lib/market/events';
import type { EvidenceItem, LiquidityLevel, LiquiditySnapshot } from './contracts';
import { clamp } from './math';

function proximity(a: number, b: number): number {
  return Math.abs(a - b) / Math.max(Math.abs(a), 1);
}

export function analyzeLiquidity(candles: CanonicalCandle[], atr: number): LiquiditySnapshot {
  if (candles.length < 10) {
    return { nearestBuySide: null, nearestSellSide: null, equalHighs: [], equalLows: [], buySideSweep: false, sellSideSweep: false, score: 0, evidence: [] };
  }
  const ordered = [...candles].sort((a, b) => a.start - b.start);
  const current = ordered.at(-1)!;
  const history = ordered.slice(-30, -1);
  const tolerance = Math.max(atr * 0.15, current.close * 0.0004);
  const highs = history.map((c) => c.high);
  const lows = history.map((c) => c.low);
  const equalHighs: number[] = [];
  const equalLows: number[] = [];
  for (let i = 0; i < highs.length; i += 1) {
    for (let j = i + 1; j < highs.length; j += 1) if (Math.abs(highs[i] - highs[j]) <= tolerance) equalHighs.push((highs[i] + highs[j]) / 2);
  }
  for (let i = 0; i < lows.length; i += 1) {
    for (let j = i + 1; j < lows.length; j += 1) if (Math.abs(lows[i] - lows[j]) <= tolerance) equalLows.push((lows[i] + lows[j]) / 2);
  }
  const buyPools = [...equalHighs, Math.max(...history.slice(-8).map((c) => c.high))];
  const sellPools = [...equalLows, Math.min(...history.slice(-8).map((c) => c.low))];
  const nearestBuy = buyPools.sort((a, b) => Math.abs(a - current.close) - Math.abs(b - current.close))[0];
  const nearestSell = sellPools.sort((a, b) => Math.abs(a - current.close) - Math.abs(b - current.close))[0];
  const buySideSweep = buyPools.some((level) => current.high > level && current.close < level && proximity(current.high, level) < 0.01);
  const sellSideSweep = sellPools.some((level) => current.low < level && current.close > level && proximity(current.low, level) < 0.01);
  const toLevel = (price: number, side: 'BUY_SIDE' | 'SELL_SIDE'): LiquidityLevel => ({
    id: `${side}:${price.toFixed(4)}`,
    side,
    price,
    source: side === 'BUY_SIDE' && equalHighs.some((x) => Math.abs(x - price) <= tolerance) ? 'EQUAL_HIGH' : side === 'SELL_SIDE' && equalLows.some((x) => Math.abs(x - price) <= tolerance) ? 'EQUAL_LOW' : 'RANGE',
    strength: clamp(50 + (side === 'BUY_SIDE' ? equalHighs.length : equalLows.length) * 5),
    swept: side === 'BUY_SIDE' ? buySideSweep : sellSideSweep,
    distanceAtr: atr > 0 ? Math.abs(price - current.close) / atr : 0,
  });
  const evidence: EvidenceItem[] = [
    { id: 'liquidity.buyPool', label: 'Buy-side liquidity', status: nearestBuy ? 'PASS' : 'UNKNOWN', value: nearestBuy ?? null, weight: 1, reason: nearestBuy ? 'A nearby buy-side liquidity reference exists.' : 'No buy-side pool identified.' },
    { id: 'liquidity.sellPool', label: 'Sell-side liquidity', status: nearestSell ? 'PASS' : 'UNKNOWN', value: nearestSell ?? null, weight: 1, reason: nearestSell ? 'A nearby sell-side liquidity reference exists.' : 'No sell-side pool identified.' },
    { id: 'liquidity.buySweep', label: 'Buy-side sweep', status: buySideSweep ? 'PASS' : 'WARN', value: buySideSweep, weight: 2, reason: buySideSweep ? 'Price traded above a buy-side pool and closed back below it.' : 'No fresh buy-side sweep.' },
    { id: 'liquidity.sellSweep', label: 'Sell-side sweep', status: sellSideSweep ? 'PASS' : 'WARN', value: sellSideSweep, weight: 2, reason: sellSideSweep ? 'Price traded below a sell-side pool and closed back above it.' : 'No fresh sell-side sweep.' },
  ];
  return {
    nearestBuySide: nearestBuy ? toLevel(nearestBuy, 'BUY_SIDE') : null,
    nearestSellSide: nearestSell ? toLevel(nearestSell, 'SELL_SIDE') : null,
    equalHighs: [...new Set(equalHighs.map((value) => Number(value.toFixed(4))))].slice(-8),
    equalLows: [...new Set(equalLows.map((value) => Number(value.toFixed(4))))].slice(-8),
    buySideSweep,
    sellSideSweep,
    score: clamp((buySideSweep || sellSideSweep ? 80 : 45) + Math.min(15, equalHighs.length + equalLows.length)),
    evidence,
  };
}
