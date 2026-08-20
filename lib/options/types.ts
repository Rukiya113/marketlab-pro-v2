import type { CanonicalInstrumentId } from '@/lib/market/events';

export type OptionSide = 'CE' | 'PE';

export type OptionMoneyness =
  | 'ITM'
  | 'ATM'
  | 'OTM';

export type OptionDataState =
  | 'LIVE'
  | 'STALE'
  | 'OFFLINE'
  | 'UNTRUSTED';

export interface OptionGreeks {
  delta: number | null;
  gamma: number | null;
  theta: number | null;
  vega: number | null;
  iv: number | null;
}

export interface OptionContract {
  instrumentKey: string;
  tradingSymbol: string;

  underlyingId: CanonicalInstrumentId;

  expiry: string;
  strike: number;
  side: OptionSide;

  lotSize: number;
  tickSize: number;

  bid: number | null;
  ask: number | null;
  ltp: number | null;

  volume: number | null;
  openInterest: number | null;
  previousOpenInterest: number | null;

  greeks: OptionGreeks;

  exchangeTimestamp: number | null;
}

export interface OptionChainSnapshot {
  underlyingId: CanonicalInstrumentId;

  underlyingPrice: number | null;

  expiry: string | null;

  receivedAt: number;

  state: OptionDataState;

  contracts: OptionContract[];
}

export interface OptionEvaluation {
  contract: OptionContract;

  moneyness: OptionMoneyness;

  distancePct: number;

  spreadPct: number | null;

  liquidityScore: number;

  greekScore: number;

  /**
   * Measures whether the option premium is responding
   * correctly to the underlying ASURA thesis.
   *
   * null means the evidence has not yet been measured.
   * It must never be assumed to have passed.
   */
  premiumResponseScore: number | null;

  /**
   * Estimated one-way execution slippage.
   */
  slippagePct: number | null;

  /**
   * Age of the most recent exchange quote.
   */
  freshnessMs: number | null;

  /**
   * Composite quality score derived only from
   * evidence actually available.
   */
  optionQualityScore: number;

  eligible: boolean;

  reasons: string[];

  blockers: string[];
}

export interface SelectedOptionContract {
  underlyingId: CanonicalInstrumentId;

  /**
   * WAIT is normalized to NEUTRAL before reaching
   * this object. Options Intelligence is never
   * allowed to create direction by itself.
   */
  direction:
    | 'BULLISH'
    | 'BEARISH'
    | 'NEUTRAL';

  side: OptionSide | null;

  selected: OptionEvaluation | null;

  alternatives: OptionEvaluation[];

  state:
    | 'SELECTED'
    | 'WAITING_FOR_CHAIN'
    | 'NO_ELIGIBLE_CONTRACT';

  at: number;
}