import type { CanonicalCandle, Direction } from '@/lib/market/events';
import { mean } from './math';
import type { OrderFlowAnalysis, OrderFlowBar } from './types';

export function analyzeOrderFlow(candles: CanonicalCandle[]): OrderFlowAnalysis {
  const recent = candles.slice(-40);
  const avgVolume = mean(recent.map((c) => c.volume)) || 1;
  const avgRange = mean(recent.map((c) => Math.max(c.high - c.low, 0.000001))) || 1;

  const bars: OrderFlowBar[] = recent.map((candle) => {
    const range = Math.max(candle.high - candle.low, 0.000001);
    const body = candle.close - candle.open;
    const bodyPct = Math.abs(body) / range;
    const volumeRatio = candle.volume / avgVolume;

    return {
      time: candle.start,
      close: candle.close,
      volume: candle.volume,
      bodyPct,
      signedPressure: Math.sign(body) * bodyPct * volumeRatio * 100,
      displacement: range / avgRange,
    };
  });

  const pressureRaw = mean(bars.slice(-8).map((b) => b.signedPressure));
  const direction: Direction =
    pressureRaw > 12 ? 'BULLISH' : pressureRaw < -12 ? 'BEARISH' : 'NEUTRAL';

  const recentVolume = mean(recent.slice(-8).map((c) => c.volume));
  const ratio = recentVolume / avgVolume;
  const participation = ratio > 1.35 ? 'HIGH' : ratio < 0.70 ? 'LOW' : 'NORMAL';

  return {
    bars,
    pressure: Math.round(pressureRaw),
    direction,
    participation,
    displacement: mean(bars.slice(-5).map((b) => b.displacement)),
  };
}
