import { randomUUID } from 'node:crypto';
import type { CanonicalInstrumentId } from '@/lib/market/events';
import { DEFAULT_PAPER_BROKER_CONFIG, type PaperBrokerConfig } from './config';
import { bps, roundMoney } from './math';
import type {
  PaperAccount,
  PaperBrokerSnapshot,
  PaperFill,
  PaperOrder,
  PaperOrderRequest,
  PaperPosition,
  PaperQuote,
  PaperTradeRecord,
} from './types';

export class PaperBroker {
  private readonly orders = new Map<string, PaperOrder>();
  private readonly positions = new Map<CanonicalInstrumentId, PaperPosition>();
  private readonly trades: PaperTradeRecord[] = [];
  private readonly quotes = new Map<CanonicalInstrumentId, PaperQuote>();
  private readonly startedAt = Date.now();
  private realizedPnl = 0;
  private estimatedCharges = 0;

  constructor(
    private config: PaperBrokerConfig = DEFAULT_PAPER_BROKER_CONFIG,
  ) {}

  configure(config: PaperBrokerConfig): void {
    this.config = { ...config };
  }

  getConfig(): PaperBrokerConfig {
    return { ...this.config };
  }

  ingestQuote(quote: PaperQuote): void {
    this.quotes.set(quote.instrumentId, quote);
    this.markPositions(quote);
    this.evaluateWorkingOrders(quote);
  }

  submit(request: PaperOrderRequest): PaperOrder {
    const now = Date.now();
    const validation = this.validateRequest(request);

    const order: PaperOrder = {
      ...request,
      id: randomUUID(),
      status: validation ? 'REJECTED' : 'NEW',
      createdAt: now,
      updatedAt: now,
      filledQuantity: 0,
      averageFillPrice: null,
      rejectionReason: validation,
      fills: [],
    };

    this.orders.set(order.id, order);

    if (!validation) {
      order.status = 'WORKING';
      this.tryFillOrder(order);
    }

    return structuredClone(order);
  }

  cancel(orderId: string): PaperOrder | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    if (
      order.status === 'FILLED' ||
      order.status === 'CANCELLED' ||
      order.status === 'REJECTED'
    ) {
      return structuredClone(order);
    }

    order.status = 'CANCELLED';
    order.updatedAt = Date.now();

    return structuredClone(order);
  }

  reset(): void {
    this.orders.clear();
    this.positions.clear();
    this.trades.splice(0, this.trades.length);
    this.quotes.clear();
    this.realizedPnl = 0;
    this.estimatedCharges = 0;
  }

  snapshot(): PaperBrokerSnapshot {
    const positions = [...this.positions.values()].map((position) =>
      structuredClone(position),
    );

    const unrealizedPnl = positions.reduce(
      (sum, position) => sum + position.unrealizedPnl,
      0,
    );

    const openRisk = positions.reduce(
      (sum, position) => sum + Math.abs(position.unrealizedPnl),
      0,
    );

    const account: PaperAccount = {
      startingCapital: this.config.startingCapital,
      cash: roundMoney(
        this.config.startingCapital +
          this.realizedPnl -
          this.estimatedCharges,
      ),
      equity: roundMoney(
        this.config.startingCapital +
          this.realizedPnl +
          unrealizedPnl -
          this.estimatedCharges,
      ),
      realizedPnl: roundMoney(this.realizedPnl),
      unrealizedPnl: roundMoney(unrealizedPnl),
      estimatedCharges: roundMoney(this.estimatedCharges),
      dailyPnl: roundMoney(this.realizedPnl + unrealizedPnl),
      openRisk: roundMoney(openRisk),
      updatedAt: Date.now(),
    };

    return {
      mode: 'PAPER',
      account,
      orders: [...this.orders.values()]
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((order) => structuredClone(order)),
      positions,
      trades: [...this.trades]
        .sort((a, b) => b.closedAt - a.closedAt)
        .map((trade) => structuredClone(trade)),
      quotes: [...this.quotes.values()].map((quote) => structuredClone(quote)),
      updatedAt: Date.now(),
    };
  }

  private validateRequest(request: PaperOrderRequest): string | null {
    if (!Number.isFinite(request.quantity) || request.quantity <= 0) {
      return 'Quantity must be greater than zero';
    }

    if (request.quantity > this.config.maxOrderQuantity) {
      return 'Quantity exceeds paper broker policy';
    }

    if (
      (request.type === 'LIMIT' || request.type === 'STOP_LIMIT') &&
      (!Number.isFinite(request.limitPrice) || (request.limitPrice ?? 0) <= 0)
    ) {
      return 'Limit price is required';
    }

    if (
      (request.type === 'STOP' || request.type === 'STOP_LIMIT') &&
      (!Number.isFinite(request.stopPrice) || (request.stopPrice ?? 0) <= 0)
    ) {
      return 'Stop price is required';
    }

    return null;
  }

  private evaluateWorkingOrders(quote: PaperQuote): void {
    for (const order of this.orders.values()) {
      if (order.instrumentId !== quote.instrumentId) continue;
      if (order.status !== 'WORKING') continue;
      this.tryFillOrder(order);
    }
  }

  private tryFillOrder(order: PaperOrder): void {
    const quote = this.quotes.get(order.instrumentId);
    if (!quote) return;

    const age = Date.now() - quote.timestamp;
    if (age > this.config.maxQuoteAgeMs) return;

    const executable = this.executionPrice(order, quote);
    if (executable == null) return;

    const slippage =
      bps(executable, this.config.slippageBps) *
      (order.side === 'BUY' ? 1 : -1);

    const fillPrice = executable + slippage;
    const grossValue = fillPrice * order.quantity;
    const charges = Math.abs(
      bps(grossValue, this.config.chargeBps),
    );

    const fill: PaperFill = {
      id: randomUUID(),
      orderId: order.id,
      instrumentId: order.instrumentId,
      side: order.side,
      quantity: order.quantity,
      price: roundMoney(fillPrice),
      grossValue: roundMoney(grossValue),
      estimatedSlippage: roundMoney(
        Math.abs(fillPrice - executable) * order.quantity,
      ),
      estimatedCharges: roundMoney(charges),
      filledAt: Date.now(),
    };

    order.fills.push(fill);
    order.filledQuantity = order.quantity;
    order.averageFillPrice = fill.price;
    order.status = 'FILLED';
    order.updatedAt = fill.filledAt;

    this.estimatedCharges += charges;
    this.applyFill(order, fill);
  }

  private executionPrice(
    order: PaperOrder,
    quote: PaperQuote,
  ): number | null {
    const buyReference = quote.ask ?? quote.last;
    const sellReference = quote.bid ?? quote.last;

    if (buyReference == null || sellReference == null) return null;

    if (order.type === 'MARKET') {
      return order.side === 'BUY' ? buyReference : sellReference;
    }

    if (order.type === 'LIMIT') {
      const limit = order.limitPrice as number;
      if (order.side === 'BUY' && sellReference <= limit) {
        return Math.min(limit, sellReference);
      }
      if (order.side === 'SELL' && buyReference >= limit) {
        return Math.max(limit, buyReference);
      }
      return null;
    }

    if (order.type === 'STOP') {
      const stop = order.stopPrice as number;
      if (order.side === 'BUY' && buyReference >= stop) return buyReference;
      if (order.side === 'SELL' && sellReference <= stop) return sellReference;
      return null;
    }

    const stop = order.stopPrice as number;
    const limit = order.limitPrice as number;

    if (order.side === 'BUY' && buyReference >= stop && sellReference <= limit) {
      return sellReference;
    }

    if (order.side === 'SELL' && sellReference <= stop && buyReference >= limit) {
      return buyReference;
    }

    return null;
  }

  private applyFill(order: PaperOrder, fill: PaperFill): void {
    const existing = this.positions.get(order.instrumentId);
    const signedFillQuantity =
      order.side === 'BUY' ? fill.quantity : -fill.quantity;

    if (!existing) {
      const position: PaperPosition = {
        instrumentId: order.instrumentId,
        symbol: order.symbol,
        quantity: signedFillQuantity,
        averagePrice: fill.price,
        lastPrice: fill.price,
        realizedPnl: 0,
        unrealizedPnl: 0,
        grossPnl: 0,
        estimatedCharges: fill.estimatedCharges,
        netPnl: -fill.estimatedCharges,
        mae: 0,
        mfe: 0,
        openedAt: fill.filledAt,
        updatedAt: fill.filledAt,
        strategy: order.strategy ?? null,
        opportunityId: order.opportunityId ?? null,
      };

      this.positions.set(order.instrumentId, position);
      return;
    }

    const sameDirection =
      Math.sign(existing.quantity) === Math.sign(signedFillQuantity);

    if (sameDirection) {
      const oldAbs = Math.abs(existing.quantity);
      const newAbs = Math.abs(signedFillQuantity);
      const combined = oldAbs + newAbs;

      existing.averagePrice =
        (existing.averagePrice * oldAbs + fill.price * newAbs) /
        Math.max(combined, 1);

      existing.quantity += signedFillQuantity;
      existing.estimatedCharges += fill.estimatedCharges;
      existing.updatedAt = fill.filledAt;
      this.markSinglePosition(existing);
      return;
    }

    const closingQuantity = Math.min(
      Math.abs(existing.quantity),
      Math.abs(signedFillQuantity),
    );

    const pnlPerUnit =
      existing.quantity > 0
        ? fill.price - existing.averagePrice
        : existing.averagePrice - fill.price;

    const realized = pnlPerUnit * closingQuantity;

    existing.realizedPnl += realized;
    this.realizedPnl += realized;
    existing.estimatedCharges += fill.estimatedCharges;

    this.trades.push({
      id: randomUUID(),
      instrumentId: existing.instrumentId,
      symbol: existing.symbol,
      side: existing.quantity > 0 ? 'BUY' : 'SELL',
      quantity: closingQuantity,
      entryPrice: roundMoney(existing.averagePrice),
      exitPrice: roundMoney(fill.price),
      grossPnl: roundMoney(realized),
      estimatedCharges: roundMoney(existing.estimatedCharges),
      netPnl: roundMoney(realized - existing.estimatedCharges),
      mae: roundMoney(existing.mae),
      mfe: roundMoney(existing.mfe),
      openedAt: existing.openedAt,
      closedAt: fill.filledAt,
      strategy: existing.strategy,
      opportunityId: existing.opportunityId,
    });

    existing.quantity += signedFillQuantity;
    existing.updatedAt = fill.filledAt;

    if (existing.quantity === 0) {
      this.positions.delete(existing.instrumentId);
      return;
    }

    if (Math.sign(existing.quantity) === Math.sign(signedFillQuantity)) {
      existing.averagePrice = fill.price;
      existing.openedAt = fill.filledAt;
      existing.realizedPnl = 0;
      existing.mae = 0;
      existing.mfe = 0;
      existing.strategy = order.strategy ?? null;
      existing.opportunityId = order.opportunityId ?? null;
    }

    this.markSinglePosition(existing);
  }

  private markPositions(quote: PaperQuote): void {
    const position = this.positions.get(quote.instrumentId);
    if (!position) return;

    position.lastPrice = quote.last ?? quote.bid ?? quote.ask;
    position.updatedAt = quote.timestamp;
    this.markSinglePosition(position);
  }

  private markSinglePosition(position: PaperPosition): void {
    if (position.lastPrice == null) return;

    const direction = position.quantity > 0 ? 1 : -1;
    const gross =
      (position.lastPrice - position.averagePrice) *
      Math.abs(position.quantity) *
      direction;

    position.unrealizedPnl = roundMoney(gross);
    position.grossPnl = roundMoney(
      position.realizedPnl + position.unrealizedPnl,
    );
    position.netPnl = roundMoney(
      position.grossPnl - position.estimatedCharges,
    );
    position.mae = Math.min(position.mae, position.unrealizedPnl);
    position.mfe = Math.max(position.mfe, position.unrealizedPnl);
  }
}
