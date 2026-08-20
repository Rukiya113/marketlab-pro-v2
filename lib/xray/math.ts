export const clamp = (value: number, min = 0, max = 100): number =>
  Math.max(min, Math.min(max, value));

export function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}
