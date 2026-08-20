import type {
  CanonicalCandle,
  CanonicalInstrumentId,
  DataQualityState,
} from '../../../lib/market/events';

import { FeatureStore } from '../../../lib/intelligence/features';
import { analyzeAsura } from '../../../lib/intelligence/asura';
import { OpportunityEngine } from '../../../lib/intelligence/opportunity';

import { createExecutionIntent } from '../../../lib/execution/intent';

import { evaluateSentinel } from '../../../lib/risk/sentinel';

import type {
  SentinelContext,
  SentinelReport,
} from '../../../lib/risk/contracts';

import type { IntelligenceStatePayload } from '../../../lib/intelligence/serialize';

/**
 * Narrow persistence contract used by IntelligenceRuntime.
 *
 * Deliberately avoids RedisClientType because redis v5 carries
 * RESP/module generics that can become incompatible across
 * compilation boundaries.
 */
export interface IntelligenceRedis {
  set(
    key: string,
    value: string,
    options?: {
      EX?: number;
    },
  ): Promise<unknown>;

  lPush(
    key: string,
    value: string,
  ): Promise<unknown>;

  lTrim(
    key: string,
    start: number,
    stop: number,
  ): Promise<unknown>;

  expire(
    key: string,
    seconds: number,
  ): Promise<unknown>;
}

export class IntelligenceRuntime {
  private readonly features = new FeatureStore();

  private readonly opportunities =
    new OpportunityEngine();

  private readonly lastState =
    new Map<
      CanonicalInstrumentId,
      IntelligenceStatePayload
    >();

  constructor(
    private readonly redis: IntelligenceRedis,
  ) {}

  async onCandle(
    candle: CanonicalCandle,
    quality: DataQualityState,
    feedAgeMs: number | null,
  ): Promise<void> {
    /*
     * Every completed/forming candle enters the feature store.
     * ASURA evaluation is triggered from the 1m stream because
     * that is the fastest decision timeframe.
     */
    this.features.ingest(candle);

    if (candle.interval !== '1m') {
      return;
    }

    const dataQuality =
      this.mapDataQuality(quality);

    const decision = analyzeAsura(
      candle.instrumentId,
      this.features,
      dataQuality,
    );

    /*
     * Missing multi-timeframe evidence is not an error.
     * ASURA remains uncommitted until Context, Setup and
     * Execution evidence are sufficiently populated.
     */
    if (!decision) {
      await this.writeState(
        candle.instrumentId,
        {
          decision: null,
          opportunity: null,
          sentinel: null,
          portfolio: null,
          updatedAt: Date.now(),
        },
      );

      return;
    }

    const opportunity =
      this.opportunities.update(decision);

    let sentinel: SentinelReport | null = null;

    if (opportunity) {
      const intent = createExecutionIntent(
        decision,
        opportunity,
      );

      if (intent) {
        const context =
          this.createSentinelContext(
            feedAgeMs,
          );

        sentinel = evaluateSentinel(
          intent,
          context,
        );
      }
    }

    await this.writeState(
      candle.instrumentId,
      {
        decision,
        opportunity,
        sentinel,
        portfolio: null,
        updatedAt: Date.now(),
      },
    );
  }

  getState(
    instrumentId: CanonicalInstrumentId,
  ): IntelligenceStatePayload | null {
    return (
      this.lastState.get(instrumentId) ??
      null
    );
  }

  private mapDataQuality(
    quality: DataQualityState,
  ): number {
    switch (quality) {
      case 'HEALTHY':
        return 99;

      case 'DEGRADED':
        return 72;

      case 'STALE':
        return 45;

      case 'UNTRUSTED':
      case 'OFFLINE':
      default:
        return 0;
    }
  }

  private createSentinelContext(
    feedAgeMs: number | null,
  ): SentinelContext {
    return {
      now: Date.now(),

      feedAgeMs,

      /*
       * These account/session values remain conservative until
       * Paper Broker / account-state persistence supplies them.
       */
      dailyPnlR: 0,
      tradesToday: 0,
      consecutiveLosses: 0,
      lastTradeAt: null,
      duplicateIntent: false,

      maxDailyLossR: 3,
      maxTradesPerDay: 8,

      cooldownMs:
        3 * 60_000,

      maxFeedAgeMs:
        5_000,

      maxSignalAgeMs:
        90_000,

      maxSpreadPct: 2,

      minLiquidityScore: 60,

      maxOptionQuoteAgeMs:
        15_000,

      minRiskReward: 1.2,

      minExpectedValueR: 0.05,
    };
  }

  private async writeState(
    instrumentId: CanonicalInstrumentId,
    payload: IntelligenceStatePayload,
  ): Promise<void> {
    this.lastState.set(
      instrumentId,
      payload,
    );

    const serialized =
      JSON.stringify(payload);

    await this.redis.set(
      `marketlab:intelligence:${instrumentId}`,
      serialized,
      {
        EX: 600,
      },
    );

    /*
     * Decision journal keeps the recent reasoning/risk state
     * for replay and diagnostics.
     */
    await this.redis.lPush(
      'marketlab:intelligence:journal',
      JSON.stringify({
        instrumentId,
        ...payload,
      }),
    );

    await this.redis.lTrim(
      'marketlab:intelligence:journal',
      0,
      999,
    );

    await this.redis.expire(
      'marketlab:intelligence:journal',
      86_400 * 14,
    );
  }
}