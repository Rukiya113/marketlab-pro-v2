export function bps(value: number, basisPoints: number): number {
  return value * (basisPoints / 10_000);
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function oppositeSide(side: 'BUY' | 'SELL'): 'BUY' | 'SELL' {
  return side === 'BUY' ? 'SELL' : 'BUY';
}
