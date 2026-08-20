import type { CanonicalInstrumentId, Direction } from '@/lib/market/events';
import type { ContextBrainResult, EvidenceItem, FeatureFrame } from '../contracts';
import type { FeatureStore } from '../features';
import { analyzeStructure } from '../structure';
import { analyzeLiquidity } from '../liquidity';
import { detectRegime } from '../regime';
import { clamp, weightedScore } from '../math';

function featureDirection(frame: FeatureFrame | null): Direction {
  if (!frame) return 'NEUTRAL';
  if (frame.close > frame.ema20 && frame.ema9 > frame.ema20 && frame.trendSlope >= 0) return 'BULLISH';
  if (frame.close < frame.ema20 && frame.ema9 < frame.ema20 && frame.trendSlope <= 0) return 'BEARISH';
  return 'NEUTRAL';
}

export function runContextBrain(instrumentId: CanonicalInstrumentId, store: FeatureStore): ContextBrainResult {
  const f30 = store.get(instrumentId, '30m');
  const f15 = store.get(instrumentId, '15m');
  if (!f15) {
    return {
      state: 'INSUFFICIENT_DATA', direction: 'WAIT', probability: 0,
      regime: { regime: 'UNKNOWN', confidence: 0, trendStrength: 0, compression: 0, volatilityScore: 0, participationScore: 0, evidence: [] },
      structure30m: null,
      structure15m: analyzeStructure([]),
      liquidity15m: analyzeLiquidity([], 0),
      locationQuality: 0, contradictionScore: 100,
      evidence: [], counterThesis: ['15m feature frame is not ready.'],
      summary: 'Waiting for sufficient 15m market history.',
    };
  }
  const structure15 = analyzeStructure(store.getCandles(instrumentId, '15m'));
  const structure30 = f30 ? analyzeStructure(store.getCandles(instrumentId, '30m')) : null;
  const liquidity15 = analyzeLiquidity(store.getCandles(instrumentId, '15m'), f15.atr14);
  const regime = detectRegime(f15, structure15);
  const d30 = featureDirection(f30);
  const d15 = featureDirection(f15);
  const votes = [d30, d15, structure30?.direction ?? 'NEUTRAL', structure15.direction].filter((d) => d === 'BULLISH' || d === 'BEARISH');
  const bullishVotes = votes.filter((d) => d === 'BULLISH').length;
  const bearishVotes = votes.filter((d) => d === 'BEARISH').length;
  const direction: Direction = bullishVotes > bearishVotes ? 'BULLISH' : bearishVotes > bullishVotes ? 'BEARISH' : 'NEUTRAL';
  const alignment = votes.length ? Math.max(bullishVotes, bearishVotes) / votes.length : 0;
  const locationQuality = clamp(70 - Math.abs(f15.distanceFromEma20Atr) * 15 + (liquidity15.buySideSweep || liquidity15.sellSideSweep ? 15 : 0));
  const contradictionScore = clamp(100 - alignment * 100);
  const probability = direction === 'NEUTRAL' ? 50 : weightedScore([[alignment * 100, 0.45], [regime.confidence, 0.25], [structure15.score, 0.2], [locationQuality, 0.1]]);
  const evidence: EvidenceItem[] = [
    { id: 'context.30m', label: '30m direction', status: !f30 ? 'UNKNOWN' : d30 === direction ? 'PASS' : 'WARN', value: d30, weight: 2, reason: !f30 ? '30m frame not ready.' : `30m feature direction is ${d30}.`, timeframe: '30m' },
    { id: 'context.15m', label: '15m direction', status: d15 === direction ? 'PASS' : 'WARN', value: d15, weight: 2, reason: `15m feature direction is ${d15}.`, timeframe: '15m' },
    { id: 'context.structure15', label: '15m structure', status: structure15.direction === direction ? 'PASS' : 'WARN', value: structure15.direction, weight: 2, reason: `15m structure is ${structure15.direction}.`, timeframe: '15m' },
    { id: 'context.regime', label: 'Regime confidence', status: regime.confidence >= 60 ? 'PASS' : 'WARN', value: regime.regime, weight: 1.5, reason: `${regime.regime} regime at ${regime.confidence}% confidence.` },
  ];
  const counterThesis: string[] = [];
  if (d30 !== 'NEUTRAL' && d30 !== direction) counterThesis.push(`30m direction ${d30} opposes ${direction}.`);
  if (structure15.direction !== 'NEUTRAL' && structure15.direction !== direction) counterThesis.push(`15m structure ${structure15.direction} opposes the proposed direction.`);
  if (regime.regime === 'VOLATILE') counterThesis.push('Volatile regime increases execution uncertainty.');
  return {
    state: direction === 'NEUTRAL' ? 'WAIT' : 'READY', direction, probability: Math.round(probability), regime,
    structure30m: structure30, structure15m: structure15, liquidity15m: liquidity15,
    locationQuality: Math.round(locationQuality), contradictionScore: Math.round(contradictionScore),
    evidence: [...evidence, ...structure15.evidence, ...liquidity15.evidence], counterThesis,
    summary: direction === 'NEUTRAL' ? 'Higher-timeframe evidence is mixed; no directional authorization.' : `${direction} context with ${regime.regime} regime and ${Math.round(probability)}% directional confidence.`,
  };
}
