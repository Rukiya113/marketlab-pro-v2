import type { CanonicalCandle, CanonicalInstrumentId, CandleInterval } from '@/lib/market/events';
import type { FeatureFrame } from './contracts';
import { ema, mean, pctChange, rsi, trueRange } from './math';

const MIN_CANDLES = 20;

function frameFromCandles(instrumentId: CanonicalInstrumentId, interval: CandleInterval, candles: CanonicalCandle[]): FeatureFrame | null {
  if (candles.length < MIN_CANDLES) return null;
  const ordered = [...candles].sort((a, b) => a.start - b.start);
  const current = ordered[ordered.length - 1];
  const closes = ordered.map((candle) => candle.close);
  const volumes = ordered.map((candle) => candle.volume);
  const trs = ordered.slice(1).map((candle, index) => trueRange(candle.high, candle.low, ordered[index].close));
  const atr14 = mean(trs.slice(-14));
  const ema9 = ema(closes.slice(-60), 9);
  const ema20 = ema(closes.slice(-80), 20);
  const ema50 = closes.length >= 50 ? ema(closes.slice(-120), 50) : null;
  const range = Math.max(current.high - current.low, 1e-9);
  const body = Math.abs(current.close - current.open);
  const upperWick = current.high - Math.max(current.open, current.close);
  const lowerWick = Math.min(current.open, current.close) - current.low;
  const volumeAverage20 = mean(volumes.slice(-20));
  const previous3 = closes[Math.max(0, closes.length - 4)];
  const previous5 = closes[Math.max(0, closes.length - 6)];
  const oldEma20 = ema(closes.slice(-40, -5), 20);

  return {
    instrumentId,
    interval,
    at: current.marketTimestamp,
    candleCount: ordered.length,
    open: current.open,
    high: current.high,
    low: current.low,
    close: current.close,
    volume: current.volume,
    ema9,
    ema20,
    ema50,
    atr14,
    atrPct: current.close ? (atr14 / current.close) * 100 : 0,
    rsi14: rsi(closes, 14),
    volumeAverage20,
    volumeRatio: volumeAverage20 > 0 ? current.volume / volumeAverage20 : 0,
    rangePct: current.close ? (range / current.close) * 100 : 0,
    bodyPct: (body / range) * 100,
    upperWickPct: (upperWick / range) * 100,
    lowerWickPct: (lowerWick / range) * 100,
    momentum3: pctChange(previous3, current.close),
    momentum5: pctChange(previous5, current.close),
    trendSlope: current.close ? ((ema20 - oldEma20) / current.close) * 100 : 0,
    distanceFromEma20Atr: atr14 > 0 ? (current.close - ema20) / atr14 : 0,
  };
}

export class FeatureStore {
  private readonly candles = new Map<string, CanonicalCandle[]>();
  private readonly features = new Map<string, FeatureFrame>();

  private key(instrumentId: CanonicalInstrumentId, interval: CandleInterval): string {
    return `${instrumentId}|${interval}`;
  }

  ingest(candle: CanonicalCandle): FeatureFrame | null {
    const key = this.key(candle.instrumentId, candle.interval);
    const previous = this.candles.get(key) ?? [];
    const next = [...previous.filter((item) => item.start !== candle.start), candle]
      .sort((a, b) => a.start - b.start)
      .slice(-240);
    this.candles.set(key, next);
    const frame = frameFromCandles(candle.instrumentId, candle.interval, next);
    if (frame) this.features.set(key, frame);
    return frame;
  }

  seed(instrumentId: CanonicalInstrumentId, interval: CandleInterval, candles: CanonicalCandle[]): FeatureFrame | null {
    const key = this.key(instrumentId, interval);
    const normalized = [...candles].sort((a, b) => a.start - b.start).slice(-240);
    this.candles.set(key, normalized);
    const frame = frameFromCandles(instrumentId, interval, normalized);
    if (frame) this.features.set(key, frame);
    return frame;
  }

  get(instrumentId: CanonicalInstrumentId, interval: CandleInterval): FeatureFrame | null {
    return this.features.get(this.key(instrumentId, interval)) ?? null;
  }

  getCandles(instrumentId: CanonicalInstrumentId, interval: CandleInterval): CanonicalCandle[] {
    return this.candles.get(this.key(instrumentId, interval)) ?? [];
  }

  hasRequiredFrames(instrumentId: CanonicalInstrumentId): boolean {
    return Boolean(this.get(instrumentId, '1m') && this.get(instrumentId, '5m') && this.get(instrumentId, '15m'));
  }
}
