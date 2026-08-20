import type { CanonicalInstrumentId } from '@/lib/market/events';

export type PaperOrderSide = 'BUY' | 'SELL';
export type PaperOrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
export type PaperOrderStatus =
  | 'NEW'
  | 'WORKING'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'EXPIRED';

export interface PaperQuote {
  instrumentId: CanonicalInstrumentId;
  bid: number | null;
  ask: number | null;
  last: number | null;
  timestamp: number;
}

export interface PaperOrderRequest {
  instrumentId: CanonicalInstrumentId;
  symbol: string;
  side: PaperOrderSide;
  type: PaperOrderType;
  quantity: number;
  limitPrice?: number | null;
  stopPrice?: number | null;
  takeProfitPrice?: number | null;
  stopLossPrice?: number | null;
  strategy?: string | null;
  opportunityId?: string | null;
  optionContractKey?: string | null;
  notes?: string | null;
}

export interface PaperFill {
  id: string;
  orderId: string;
  instrumentId: CanonicalInstrumentId;
  side: PaperOrderSide;
  quantity: number;
  price: number;
  grossValue: number;
  estimatedSlippage: number;
  estimatedCharges: number;
  filledAt: number;
}

export interface PaperOrder extends PaperOrderRequest {
  id: string;
  status: PaperOrderStatus;
  createdAt: number;
  updatedAt: number;
  filledQuantity: number;
  averageFillPrice: number | null;
  rejectionReason: string | null;
  fills: PaperFill[];
}

export interface PaperPosition {
  instrumentId: CanonicalInstrumentId;
  symbol: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number | null;
  realizedPnl: number;
  unrealizedPnl: number;
  grossPnl: number;
  estimatedCharges: number;
  netPnl: number;
  mae: number;
  mfe: number;
  openedAt: number;
  updatedAt: number;
  strategy: string | null;
  opportunityId: string | null;
}

export interface PaperTradeRecord {
  id: string;
  instrumentId: CanonicalInstrumentId;
  symbol: string;
  side: PaperOrderSide;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  grossPnl: number;
  estimatedCharges: number;
  netPnl: number;
  mae: number;
  mfe: number;
  openedAt: number;
  closedAt: number;
  strategy: string | null;
  opportunityId: string | null;
}

export interface PaperAccount {
  startingCapital: number;
  cash: number;
  equity: number;
  realizedPnl: number;
  unrealizedPnl: number;
  estimatedCharges: number;
  dailyPnl: number;
  openRisk: number;
  updatedAt: number;
}

export interface PaperBrokerSnapshot {
  mode: 'PAPER';
  account: PaperAccount;
  orders: PaperOrder[];
  positions: PaperPosition[];
  trades: PaperTradeRecord[];
  quotes: PaperQuote[];
  updatedAt: number;
}
