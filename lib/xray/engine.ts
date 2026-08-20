import type { CanonicalCandle, CanonicalInstrumentId } from '@/lib/market/events';
import { analyzeHeatmap } from './heatmap';
import { analyzeImbalances } from './imbalances';
import { analyzeLiquidity } from './liquidity';
import { analyzeOrderFlow } from './orderflow';
import { analyzeStructure } from './structure';
import type { XRaySnapshot } from './types';
import { analyzeVolumeProfile } from './volumeProfile';

export function buildXRaySnapshot(
  instrumentId: CanonicalInstrumentId,
  candles: CanonicalCandle[],
): XRaySnapshot {
  const structure = analyzeStructure(candles);
  const liquidity = analyzeLiquidity(candles, structure);
  const orderFlow = analyzeOrderFlow(candles);
  const imbalances = analyzeImbalances(candles);
  const volumeProfile = analyzeVolumeProfile(candles);
  const heatmap = analyzeHeatmap({
    structure,
    liquidity,
    orderFlow,
    imbalances,
    volumeProfile,
  });

  return {
    instrumentId,
    interval: candles.at(-1)?.interval ?? '5m',
    generatedAt: Date.now(),
    candleCount: candles.length,
    lastPrice: candles.at(-1)?.close ?? null,
    structure,
    liquidity,
    orderFlow,
    imbalances,
    volumeProfile,
    heatmap,
  };
}
