import type { CanonicalCandle } from '@/lib/market/events';
import type { VolumeNode, VolumeProfileAnalysis } from './types';

export function analyzeVolumeProfile(
  candles: CanonicalCandle[],
  bins = 24,
): VolumeProfileAnalysis {
  if (!candles.length) {
    return {
      nodes: [],
      poc: null,
      valueAreaLow: null,
      valueAreaHigh: null,
    };
  }

  const low = Math.min(...candles.map((c) => c.low));
  const high = Math.max(...candles.map((c) => c.high));
  const span = Math.max(high - low, 0.000001);
  const step = span / bins;
  const bucketVolume = new Array<number>(bins).fill(0);

  for (const candle of candles) {
    const typical = (candle.high + candle.low + candle.close) / 3;
    const index = Math.max(0, Math.min(bins - 1, Math.floor((typical - low) / step)));
    bucketVolume[index] += candle.volume;
  }

  const total = bucketVolume.reduce((a, b) => a + b, 0) || 1;
  const nodes: VolumeNode[] = bucketVolume.map((volume, index) => ({
    price: low + step * (index + 0.5),
    volume,
    pct: (volume / total) * 100,
  }));

  const pocNode = [...nodes].sort((a, b) => b.volume - a.volume)[0] ?? null;
  const ordered = [...nodes].sort((a, b) => b.volume - a.volume);

  let cumulative = 0;
  const valueNodes: VolumeNode[] = [];

  for (const node of ordered) {
    if (cumulative / total >= 0.70) break;
    cumulative += node.volume;
    valueNodes.push(node);
  }

  return {
    nodes,
    poc: pocNode?.price ?? null,
    valueAreaLow: valueNodes.length ? Math.min(...valueNodes.map((n) => n.price)) : null,
    valueAreaHigh: valueNodes.length ? Math.max(...valueNodes.map((n) => n.price)) : null,
  };
}
