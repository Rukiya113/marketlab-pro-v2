import type { CanonicalInstrumentId } from '@/lib/market/events';
import { CORE_INSTRUMENTS } from '@/lib/market/instruments';
import { setOptionChain } from '@/lib/options/store';
import type {
  OptionChainSnapshot,
  OptionContract,
} from '@/lib/options/types';
import { upstoxGet } from '@/lib/upstox/http';

import type {
  DerivativeContract,
  DerivativeUniverse,
  OptionSide,
} from './types';
import { setDerivativeUniverse } from './store';

type ApiEnvelope<T> = {
  status?: string;
  data?: T;
};

type RawContract = {
  instrument_key?: string;
  trading_symbol?: string;
  expiry?: string | number;
  strike_price?: number;
  lot_size?: number;
  tick_size?: number;
  instrument_type?: string;
  underlying_key?: string;
  underlying_symbol?: string;
};

type RawOptionLeg = {
  instrument_key?: string;
  market_data?: Record<string, unknown>;
  option_greeks?: Record<string, unknown>;
};

type RawChainRow = {
  expiry?: string;
  strike_price?: number;
  underlying_spot_price?: number;
  call_options?: RawOptionLeg;
  put_options?: RawOptionLeg;
};

type SearchData =
  | {
      data?: RawContract[];
    }
  | RawContract[];

type QuoteRecord = Record<string, unknown>;
type QuoteMap = Record<string, QuoteRecord>;

type QuoteEnvelope = ApiEnvelope<QuoteMap>;

const CACHE_MS = 30_000;

const cache = new Map<
  CanonicalInstrumentId,
  {
    at: number;
    value: DerivativeUniverse;
  }
>();

function identity(id: CanonicalInstrumentId) {
  return CORE_INSTRUMENTS.find(
    (instrument) => instrument.id === id,
  ) ?? null;
}

function n(value: unknown): number | null {
  return typeof value === 'number' &&
    Number.isFinite(value)
    ? value
    : null;
}

function s(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function expiry(
  value: string | number | undefined,
): string {
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  if (typeof value === 'number') {
    return new Date(value)
      .toISOString()
      .slice(0, 10);
  }

  return '';
}

function marketValue(
  market: Record<string, unknown> | undefined,
  ...keys: string[]
): number | null {
  if (!market) {
    return null;
  }

  for (const key of keys) {
    const value = n(market[key]);

    if (value !== null) {
      return value;
    }
  }

  return null;
}

function quoteValue(
  quote: QuoteRecord | undefined,
  ...keys: string[]
): number | null {
  return marketValue(quote, ...keys);
}

function firstDepth(
  quote: QuoteRecord | undefined,
  side: 'buy' | 'sell',
): number | null {
  const depth = quote?.depth as
    | {
        buy?: Array<Record<string, unknown>>;
        sell?: Array<Record<string, unknown>>;
      }
    | undefined;

  return marketValue(
    depth?.[side]?.[0],
    'price',
  );
}

async function optionContracts(
  upstoxKey: string,
): Promise<RawContract[]> {
  const response = await upstoxGet<
    ApiEnvelope<RawContract[]>
  >(
    '/option/contract',
    {
      instrument_key: upstoxKey,
    },
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
}

async function optionChain(
  upstoxKey: string,
  expiryDate: string,
): Promise<RawChainRow[]> {
  const response = await upstoxGet<
    ApiEnvelope<RawChainRow[]>
  >(
    '/option/chain',
    {
      instrument_key: upstoxKey,
      expiry_date: expiryDate,
    },
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
}

async function futures(
  upstoxKey: string,
  label: string,
): Promise<RawContract[]> {
  const query =
    label === 'NIFTY 50'
      ? 'NIFTY'
      : label;

  const response = await upstoxGet<
    ApiEnvelope<SearchData>
  >(
    '/instruments/search',
    {
      query,
      exchanges: 'NSE',
      segments: 'FUT',
      page_number: 1,
      records: 30,
    },
  );

  const data = response.data;

  const rows: RawContract[] =
    Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : [];

  const normalizedQuery = query
    .toUpperCase()
    .replace(/\s+/g, '');

  return rows.filter((contract) => {
    if (
      contract.underlying_key ===
      upstoxKey
    ) {
      return true;
    }

    const underlying = s(
      contract.underlying_symbol,
    )
      .toUpperCase()
      .replace(/\s+/g, '');

    return underlying.includes(
      normalizedQuery,
    );
  });
}

async function quotes(
  keys: string[],
): Promise<QuoteMap> {
  if (!keys.length) {
    return {};
  }

  const output: QuoteMap = {};

  for (
    let index = 0;
    index < keys.length;
    index += 500
  ) {
    const response =
      await upstoxGet<QuoteEnvelope>(
        '/market-quote/quotes',
        {
          instrument_key: keys
            .slice(index, index + 500)
            .join(','),
        },
      );

    if (response.data) {
      Object.assign(
        output,
        response.data,
      );
    }
  }

  return output;
}

function findFutureQuote(
  quoteMap: QuoteMap,
  instrumentKey: string,
): QuoteRecord | undefined {
  const direct =
    quoteMap[instrumentKey];

  if (direct) {
    return direct;
  }

  return Object.values(
    quoteMap,
  ).find(
    (quote) =>
      s(quote.instrument_token) ===
      instrumentKey,
  );
}

export async function loadDerivativeUniverse(
  id: CanonicalInstrumentId,
  force = false,
): Promise<DerivativeUniverse> {
  const prior = cache.get(id);

  if (
    !force &&
    prior &&
    Date.now() - prior.at < CACHE_MS
  ) {
    return prior.value;
  }

  const base = identity(id);

  if (!base) {
    return {
      underlyingId: id,
      state: 'OFFLINE',
      contracts: [],
      updatedAt: Date.now(),
    };
  }

  const contracts =
    await optionContracts(
      base.upstoxKey,
    );

  const expiries = [
    ...new Set(
      contracts
        .map((contract) =>
          expiry(contract.expiry),
        )
        .filter(Boolean),
    ),
  ].sort();

  const nearest =
    expiries[0] ?? '';

  const chainRows = nearest
    ? await optionChain(
        base.upstoxKey,
        nearest,
      )
    : [];

  const optionMeta =
    new Map<string, RawContract>();

  for (const contract of contracts) {
    if (!contract.instrument_key) {
      continue;
    }

    optionMeta.set(
      contract.instrument_key,
      contract,
    );
  }

  const derivatives:
    DerivativeContract[] = [];

  const options:
    OptionContract[] = [];

  let spot: number | null = null;

  for (const row of chainRows) {
    spot =
      spot ??
      n(row.underlying_spot_price);

    const legs = [
      [
        'CE',
        row.call_options,
      ],
      [
        'PE',
        row.put_options,
      ],
    ] as const;

    for (const [side, leg] of legs) {
      if (!leg?.instrument_key) {
        continue;
      }

      const meta =
        optionMeta.get(
          leg.instrument_key,
        );

      const market =
        leg.market_data ?? {};

      const greeks =
        leg.option_greeks ?? {};

      const strike =
        n(row.strike_price) ??
        n(meta?.strike_price) ??
        0;

      const expiryDate =
        expiry(meta?.expiry) ||
        nearest;

      const lotSize =
        n(meta?.lot_size) ?? 1;

      const bid =
        marketValue(
          market,
          'bid_price',
          'bidPrice',
        );

      const ask =
        marketValue(
          market,
          'ask_price',
          'askPrice',
        );

      const last =
        marketValue(
          market,
          'ltp',
          'last_price',
          'lastPrice',
        );

      const oi =
        marketValue(
          market,
          'oi',
          'open_interest',
        );

      const volume =
        marketValue(
          market,
          'volume',
          'volume_traded_today',
        );

      const at = Date.now();

      const derivative:
        DerivativeContract = {
        instrumentKey:
          leg.instrument_key,

        underlyingId: id,

        symbol:
          meta?.trading_symbol ??
          leg.instrument_key,

        segment: 'OPTIONS',

        expiry: expiryDate,

        strike,

        optionSide:
          side as OptionSide,

        lotSize,

        bid,
        ask,
        last,
        oi,
        volume,

        iv: marketValue(
          greeks,
          'iv',
        ),

        delta: marketValue(
          greeks,
          'delta',
        ),

        gamma: marketValue(
          greeks,
          'gamma',
        ),

        theta: marketValue(
          greeks,
          'theta',
        ),

        vega: marketValue(
          greeks,
          'vega',
        ),

        at,
      };

      derivatives.push(
        derivative,
      );

      options.push({
        instrumentKey:
          derivative.instrumentKey,

        tradingSymbol:
          derivative.symbol,

        underlyingId: id,

        expiry:
          derivative.expiry,

        strike,

        side:
          side as OptionSide,

        lotSize,

        tickSize:
          n(meta?.tick_size) ??
          0.05,

        bid,
        ask,
        ltp: last,

        volume,

        openInterest: oi,

        previousOpenInterest:
          marketValue(
            market,
            'prev_oi',
            'previous_oi',
          ),

        greeks: {
          delta:
            derivative.delta,

          gamma:
            derivative.gamma,

          theta:
            derivative.theta,

          vega:
            derivative.vega,

          iv:
            derivative.iv,
        },

        exchangeTimestamp: at,
      });
    }
  }

  const futureContracts =
    await futures(
      base.upstoxKey,
      base.displayName,
    ).catch(() => []);

  const futureKeys =
    futureContracts
      .map(
        (contract) =>
          contract.instrument_key ??
          '',
      )
      .filter(
        (key): key is string =>
          Boolean(key),
      );

  const futureQuotes: QuoteMap =
    await quotes(
      futureKeys,
    ).catch(
      (): QuoteMap => ({}),
    );

  for (
    const meta of futureContracts
  ) {
    const instrumentKey =
      meta.instrument_key;

    if (!instrumentKey) {
      continue;
    }

    const quote =
      findFutureQuote(
        futureQuotes,
        instrumentKey,
      );

    derivatives.push({
      instrumentKey,

      underlyingId: id,

      symbol:
        meta.trading_symbol ??
        instrumentKey,

      segment: 'FUTURES',

      expiry:
        expiry(meta.expiry),

      strike: null,

      optionSide: null,

      lotSize:
        n(meta.lot_size) ?? 1,

      bid:
        firstDepth(
          quote,
          'buy',
        ) ??
        quoteValue(
          quote,
          'bid_price',
        ),

      ask:
        firstDepth(
          quote,
          'sell',
        ) ??
        quoteValue(
          quote,
          'ask_price',
        ),

      last:
        quoteValue(
          quote,
          'last_price',
          'ltp',
        ),

      oi:
        quoteValue(
          quote,
          'oi',
        ),

      volume:
        quoteValue(
          quote,
          'volume',
        ),

      iv: null,
      delta: null,
      gamma: null,
      theta: null,
      vega: null,

      at: Date.now(),
    });
  }

  const universe:
    DerivativeUniverse = {
    underlyingId: id,

    state:
      derivatives.length
        ? 'LIVE'
        : 'OFFLINE',

    contracts:
      derivatives,

    updatedAt:
      Date.now(),
  };

  const snapshot:
    OptionChainSnapshot = {
    underlyingId: id,

    underlyingPrice:
      spot,

    expiry:
      nearest || null,

    receivedAt:
      Date.now(),

    state:
      options.length
        ? 'LIVE'
        : 'OFFLINE',

    contracts:
      options,
  };

  setDerivativeUniverse(
    universe,
  );

  setOptionChain(
    snapshot,
  );

  cache.set(
    id,
    {
      at: Date.now(),
      value: universe,
    },
  );

  return universe;
}