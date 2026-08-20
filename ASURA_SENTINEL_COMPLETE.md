# MarketLab Pro — Complete ASURA + Sentinel subsystem replacement

This package is intentionally self-contained for the ASURA/Strategies/Opportunity/Sentinel/Portfolio path. It includes every local module imported by the intelligence engine, the server state route, gateway integration, and the principal UI surfaces.

It does not fabricate market observations. Without canonical multi-timeframe candles, ASURA returns no decision and execution remains blocked.

Apply at repository root with `unzip -o marketlab-asura-sentinel-complete.zip`, then run `rm -rf .next && npm run verify`.
