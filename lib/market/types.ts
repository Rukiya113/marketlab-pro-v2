export type FeedState = 'OFFLINE'|'CONNECTING'|'LIVE'|'DEGRADED'|'STALE';
export type ExecutionMode = 'OBSERVE'|'PAPER'|'SANDBOX'|'LIVE_ASSISTED'|'LIVE_AUTONOMOUS';
export interface MarketSnapshot { feed: FeedState; latencyMs?: number; connected: boolean; }
