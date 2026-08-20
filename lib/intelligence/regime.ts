import type { FeatureFrame, RegimeSnapshot, StructureSnapshot } from './contracts';
import { clamp, weightedScore } from './math';

export function detectRegime(frame: FeatureFrame, structure: StructureSnapshot): RegimeSnapshot {
  const trendStrength = clamp(Math.abs(frame.distanceFromEma20Atr) * 24 + Math.abs(frame.trendSlope) * 900 + (structure.bos ? 18 : 0));
  const compression = clamp((structure.compression ? 75 : 20) + (frame.atrPct < 0.18 ? 20 : 0));
  const volatilityScore = clamp(frame.atrPct * 220 + frame.rangePct * 120);
  const participationScore = clamp(frame.volumeRatio * 55);
  let regime: RegimeSnapshot['regime'] = 'TRANSITION';
  let confidence = 55;
  if (compression >= 70 && participationScore < 80) { regime = 'RANGE'; confidence = weightedScore([[compression, 0.6], [100 - trendStrength, 0.4]]); }
  if (trendStrength >= 65 && !structure.compression) { regime = 'TREND'; confidence = weightedScore([[trendStrength, 0.7], [participationScore, 0.3]]); }
  if (structure.bos && structure.displacement && participationScore >= 60) { regime = 'BREAKOUT'; confidence = weightedScore([[structure.score, 0.4], [participationScore, 0.35], [volatilityScore, 0.25]]); }
  if (volatilityScore >= 85 && trendStrength < 55) { regime = 'VOLATILE'; confidence = weightedScore([[volatilityScore, 0.7], [100 - trendStrength, 0.3]]); }
  return {
    regime,
    confidence: Math.round(clamp(confidence)),
    trendStrength: Math.round(trendStrength),
    compression: Math.round(compression),
    volatilityScore: Math.round(volatilityScore),
    participationScore: Math.round(participationScore),
    evidence: [
      { id: 'regime.trend', label: 'Trend strength', status: trendStrength >= 60 ? 'PASS' : 'WARN', value: Math.round(trendStrength), weight: 2, reason: 'Derived from EMA separation, slope and structural breaks.' },
      { id: 'regime.compression', label: 'Compression', status: compression >= 65 ? 'PASS' : 'WARN', value: Math.round(compression), weight: 1, reason: 'Compares recent range contraction and ATR state.' },
      { id: 'regime.participation', label: 'Participation', status: participationScore >= 60 ? 'PASS' : 'WARN', value: Math.round(participationScore), weight: 1, reason: 'Derived from relative volume.' },
    ],
  };
}
