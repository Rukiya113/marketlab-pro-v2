import { MarketLabRuntimeIntegration } from './runtime';

declare global {
  var __marketLabRuntimeIntegration: MarketLabRuntimeIntegration | undefined;
}

export const runtimeIntegration =
  globalThis.__marketLabRuntimeIntegration ??
  (globalThis.__marketLabRuntimeIntegration = new MarketLabRuntimeIntegration());
