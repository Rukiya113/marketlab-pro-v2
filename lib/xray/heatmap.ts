import type {
  HeatCell,
  HeatmapAnalysis,
  ImbalanceAnalysis,
  LiquidityAnalysis,
  OrderFlowAnalysis,
  StructureAnalysis,
  VolumeProfileAnalysis,
} from './types';

function heatState(score: number): HeatCell['state'] {
  if (score >= 75) return 'HOT';
  if (score >= 58) return 'WARM';
  if (score <= 30) return 'COLD';
  return 'NEUTRAL';
}

export function analyzeHeatmap(input: {
  structure: StructureAnalysis;
  liquidity: LiquidityAnalysis;
  orderFlow: OrderFlowAnalysis;
  imbalances: ImbalanceAnalysis;
  volumeProfile: VolumeProfileAnalysis;
}): HeatmapAnalysis {
  const structureScore =
    input.structure.direction === 'NEUTRAL'
      ? 40
      : 65 + Math.min(25, input.structure.events.slice(-5).length * 5);

  const liquidityScore =
    input.liquidity.recentSweep
      ? 85
      : input.liquidity.nearestBuySide || input.liquidity.nearestSellSide
        ? 60
        : 35;

  const flowScore = Math.max(0, Math.min(100, 50 + Math.abs(input.orderFlow.pressure) * 0.6));
  const imbalanceScore =
    input.imbalances.nearestBullish || input.imbalances.nearestBearish ? 70 : 40;
  const profileScore = input.volumeProfile.poc != null ? 65 : 30;

  const cells: HeatCell[] = [
    {
      label: 'STRUCTURE',
      score: Math.round(structureScore),
      state: heatState(structureScore),
      detail: input.structure.direction,
    },
    {
      label: 'LIQUIDITY',
      score: Math.round(liquidityScore),
      state: heatState(liquidityScore),
      detail: input.liquidity.recentSweep ? 'RECENT SWEEP' : 'POOLS MAPPED',
    },
    {
      label: 'ORDER FLOW',
      score: Math.round(flowScore),
      state: heatState(flowScore),
      detail: `${input.orderFlow.direction} · ${input.orderFlow.participation}`,
    },
    {
      label: 'IMBALANCE',
      score: Math.round(imbalanceScore),
      state: heatState(imbalanceScore),
      detail:
        input.imbalances.nearestBullish || input.imbalances.nearestBearish
          ? 'ACTIVE FVG'
          : 'NONE',
    },
    {
      label: 'VOLUME PROFILE',
      score: Math.round(profileScore),
      state: heatState(profileScore),
      detail: input.volumeProfile.poc != null ? 'POC READY' : 'INSUFFICIENT',
    },
  ];

  const score = Math.round(cells.reduce((sum, cell) => sum + cell.score, 0) / cells.length);

  return {
    score,
    state: heatState(score),
    cells,
  };
}
