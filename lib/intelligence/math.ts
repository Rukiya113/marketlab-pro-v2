export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function mean(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function ema(values: number[], period: number): number {
  if (!values.length) return 0;
  const alpha = 2 / (period + 1);
  let result = values[0];
  for (let i = 1; i < values.length; i += 1) result = values[i] * alpha + result * (1 - alpha);
  return result;
}

export function sma(values: number[], period: number): number {
  const sample = values.slice(-period);
  return mean(sample);
}

export function trueRange(high: number, low: number, previousClose: number): number {
  return Math.max(high - low, Math.abs(high - previousClose), Math.abs(low - previousClose));
}

export function rsi(values: number[], period = 14): number {
  if (values.length < 2) return 50;
  const deltas = values.slice(1).map((value, index) => value - values[index]);
  const sample = deltas.slice(-period);
  let gains = 0;
  let losses = 0;
  for (const delta of sample) {
    if (delta >= 0) gains += delta;
    else losses += Math.abs(delta);
  }
  if (losses === 0) return gains > 0 ? 100 : 50;
  const rs = (gains / Math.max(1, sample.length)) / (losses / Math.max(1, sample.length));
  return 100 - 100 / (1 + rs);
}

export function pctChange(from: number, to: number): number {
  return from === 0 ? 0 : ((to - from) / Math.abs(from)) * 100;
}

export function scoreFromEvidence(items: { status: string; weight: number }[]): number {
  let earned = 0;
  let possible = 0;
  for (const item of items) {
    possible += item.weight;
    if (item.status === 'PASS') earned += item.weight;
    else if (item.status === 'WARN') earned += item.weight * 0.5;
  }
  return possible ? clamp((earned / possible) * 100) : 0;
}

export function weightedScore(parts: Array<[number, number]>): number {
  const totalWeight = parts.reduce((sum, [, weight]) => sum + weight, 0);
  if (!totalWeight) return 0;
  return clamp(parts.reduce((sum, [value, weight]) => sum + value * weight, 0) / totalWeight);
}
