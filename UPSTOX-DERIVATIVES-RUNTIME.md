# Upstox Derivatives Runtime

This build replaces the empty in-memory-only derivatives path with authenticated on-demand Upstox loading.

Flow: session -> option contracts -> nearest option chain -> futures instrument search -> market quotes -> normalized DerivativeUniverse + OptionChainSnapshot.

Safety: no contracts, quotes, Greeks, strikes, expiries, or prices are fabricated. When Upstox is disconnected or an API call fails, the runtime remains OFFLINE.
