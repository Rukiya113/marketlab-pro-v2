import type { Direction } from '@/lib/market/events';
import type {
  OptionChainSnapshot,
  OptionContract,
  OptionEvaluation,
  OptionSide,
  SelectedOptionContract,
} from './types';

export interface OptionSelectionPolicy {
  maxAgeMs: number;
  maxSpreadPct: number;
  minVolume: number;
  minOpenInterest: number;
  preferredAbsDeltaMin: number;
  preferredAbsDeltaMax: number;
  maxDistancePct: number;
}

export const DEFAULT_OPTION_POLICY: OptionSelectionPolicy = {
  maxAgeMs: 15_000,
  maxSpreadPct: 2,
  minVolume: 1,
  minOpenInterest: 1,
  preferredAbsDeltaMin: 0.30,
  preferredAbsDeltaMax: 0.70,
  maxDistancePct: 2,
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeDirection(
  direction: Direction,
): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
  if (direction === 'BULLISH') return 'BULLISH';
  if (direction === 'BEARISH') return 'BEARISH';

  // NEUTRAL and WAIT must never authorize an option contract.
  return 'NEUTRAL';
}

function evaluate(
  contract: OptionContract,
  underlyingPrice: number,
  now: number,
  policy: OptionSelectionPolicy,
): OptionEvaluation {
  const blockers: string[] = [];
  const reasons: string[] = [];

  const distancePct =
    (Math.abs(contract.strike - underlyingPrice) /
      Math.max(underlyingPrice, 1)) *
    100;

  const hasValidMarket =
    contract.bid !== null &&
    contract.ask !== null &&
    contract.bid > 0 &&
    contract.ask >= contract.bid;

  const midpoint = hasValidMarket
    ? ((contract.bid as number) + (contract.ask as number)) / 2
    : contract.ltp;

  const spreadPct =
    hasValidMarket && midpoint !== null && midpoint > 0
      ? (((contract.ask as number) - (contract.bid as number)) /
          midpoint) *
        100
      : null;

  const freshnessMs =
    contract.exchangeTimestamp === null
      ? null
      : Math.max(0, now - contract.exchangeTimestamp);

  if (freshnessMs === null) {
    blockers.push('Missing exchange timestamp');
  } else if (freshnessMs > policy.maxAgeMs) {
    blockers.push('Option quote is stale');
  }

  if (spreadPct === null) {
    blockers.push('Bid/ask spread unavailable');
  } else if (spreadPct > policy.maxSpreadPct) {
    blockers.push(
      `Spread ${spreadPct.toFixed(2)}% exceeds ${policy.maxSpreadPct.toFixed(2)}%`,
    );
  }

  if ((contract.volume ?? 0) < policy.minVolume) {
    blockers.push('Insufficient traded volume');
  }

  if ((contract.openInterest ?? 0) < policy.minOpenInterest) {
    blockers.push('Insufficient open interest');
  }

  if (distancePct > policy.maxDistancePct) {
    blockers.push('Strike is too far from underlying');
  }

  const absDelta =
    contract.greeks.delta === null
      ? null
      : Math.abs(contract.greeks.delta);

  if (absDelta === null) {
    blockers.push('Delta unavailable');
  }

  const volumeScore = clamp(
    Math.log10(Math.max(1, contract.volume ?? 0)) * 20,
  );

  const oiScore = clamp(
    Math.log10(Math.max(1, contract.openInterest ?? 0)) * 18,
  );

  const spreadScore =
    spreadPct === null ? 0 : clamp(100 - spreadPct * 25);

  const liquidityScore = Math.round(
    volumeScore * 0.35 +
      oiScore * 0.35 +
      spreadScore * 0.30,
  );

  let greekScore = 0;

  if (absDelta !== null) {
    if (
      absDelta >= policy.preferredAbsDeltaMin &&
      absDelta <= policy.preferredAbsDeltaMax
    ) {
      greekScore = 100;
      reasons.push('Delta inside preferred execution band');
    } else {
      greekScore = clamp(
        100 - Math.abs(absDelta - 0.5) * 150,
      );
    }
  }

  const distanceScore = clamp(
    100 - distancePct * 35,
  );

  const freshnessScore =
    freshnessMs === null
      ? 0
      : clamp(
          100 -
            (freshnessMs / policy.maxAgeMs) * 100,
        );

  const optionQualityScore = Math.round(
    liquidityScore * 0.35 +
      greekScore * 0.25 +
      distanceScore * 0.20 +
      freshnessScore * 0.20,
  );

  if (liquidityScore >= 70) {
    reasons.push('Liquidity quality acceptable');
  }

  return {
    contract,
    moneyness:
      distancePct <= 0.25
        ? 'ATM'
        : contract.side === 'CE'
          ? contract.strike < underlyingPrice
            ? 'ITM'
            : 'OTM'
          : contract.strike > underlyingPrice
            ? 'ITM'
            : 'OTM',
    distancePct,
    spreadPct,
    liquidityScore,
    greekScore,
    premiumResponseScore: null,
    slippagePct:
      spreadPct === null ? null : spreadPct / 2,
    freshnessMs,
    optionQualityScore,
    eligible: blockers.length === 0,
    reasons,
    blockers,
  };
}

export function selectOptionContract(
  snapshot: OptionChainSnapshot,
  rawDirection: Direction,
  policy: OptionSelectionPolicy = DEFAULT_OPTION_POLICY,
): SelectedOptionContract {
  const now = Date.now();

  const direction = normalizeDirection(rawDirection);

  /*
   * WAIT and NEUTRAL are intentionally converted to NEUTRAL.
   * Options Intelligence must not infer CE/PE direction itself.
   */
  if (
    direction === 'NEUTRAL' ||
    snapshot.state !== 'LIVE' ||
    snapshot.underlyingPrice === null ||
    snapshot.contracts.length === 0
  ) {
    return {
      underlyingId: snapshot.underlyingId,
      direction,
      side: null,
      selected: null,
      alternatives: [],
      state: 'WAITING_FOR_CHAIN',
      at: now,
    };
  }

  const side: OptionSide =
    direction === 'BEARISH' ? 'PE' : 'CE';

  const ranked = snapshot.contracts
    .filter((contract) => contract.side === side)
    .map((contract) =>
      evaluate(
        contract,
        snapshot.underlyingPrice as number,
        now,
        policy,
      ),
    )
    .sort((a, b) => {
      if (a.eligible !== b.eligible) {
        return Number(b.eligible) - Number(a.eligible);
      }

      return (
        b.optionQualityScore -
        a.optionQualityScore
      );
    });

  const selected =
    ranked.find((item) => item.eligible) ?? null;

  return {
    underlyingId: snapshot.underlyingId,
    direction,
    side,
    selected,
    alternatives: ranked.slice(0, 5),
    state: selected
      ? 'SELECTED'
      : 'NO_ELIGIBLE_CONTRACT',
    at: now,
  };
}