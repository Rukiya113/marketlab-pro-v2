# MarketLab Pro — Consolidated Complete Build

This repository consolidates the current MarketLab Pro source and the previously delivered feature packages into one tree.

## Product flow
Upstox canonical market data -> Feature/X-RAY -> ASURA Context/Setup/Execution -> Strategy Competition -> Opportunity -> Derivatives/Options -> Sentinel -> Portfolio Governor -> AUTO PAPER execution -> Journal/Memory -> Diagnostics.

## Included
- Trading workstation, Explorer, Watchlist, Indices, Scanner
- Canonical candle/tick market APIs and Upstox OAuth/gateway
- X-RAY structure/liquidity/orderflow/imbalance/heatmap/volume-profile engines
- ASURA Context, Setup and Execution brains with interactive compact/full views
- Trend Pullback, Liquidity Sweep and Breakout-Retest competition
- Opportunity lifecycle
- Options intelligence and typed Index Options/Index Futures universe
- Sentinel execution gates and Portfolio Governor
- Paper Broker with market/limit/stop/stop-limit orders, fills, positions, charges, slippage, P&L, MAE/MFE
- AUTO PAPER orchestrator gated by Settings + ASURA + Sentinel + Portfolio + real derivative quote availability
- Emergency kill switch; live broker order placement remains locked
- Journal, Memory and expectancy aggregation
- Diagnostics/System Pulse
- Central Settings with runtime Paper Broker application and theme control

## Safety boundary
`LIVE` exists as a configuration value but this build intentionally does not auto-send live broker orders. AUTO execution is implemented only for PAPER and refuses to fabricate derivative contracts or quotes. Upstox derivative universe ingestion is available at `POST /api/derivatives/universe` and must be fed genuine provider data.

## Verification
Run:

```bash
npm ci
rm -rf .next .next-broken-*
npm run verify
```

If a stale `.next` directory causes an `_not-found` trace error, stop Next processes, remove `.next`, and rerun. Do not lint `.next-broken-*` directories.
