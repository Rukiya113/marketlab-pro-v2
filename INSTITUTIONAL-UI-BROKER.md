# MarketLab Pro V2 — Institutional UI + Broker Connection Manager

This consolidated repository combines the Broker Connection Manager with the institutional terminal visual layer.

## UI principles
- Deep slate terminal surfaces (#090D16 / #121824)
- Emerald for live/profit/approval, crimson for loss/block, violet/cyan for ASURA/intelligence
- Inter/Plus Jakarta system fallback for UI; JetBrains Mono/Geist Mono fallback stack for market data
- Dense 11–20px hierarchy
- Short transform/opacity/color micro-interactions only
- Reduced-motion support
- Glass blur limited to the top shell; chart/table surfaces avoid expensive blur

## Broker principles
- One-time server-side configuration
- OAuth plus manual-token development fallback
- Persistent valid-session restoration on startup
- Reauth when Upstox expires the token
- No broker secret/token in browser localStorage
- Live execution remains separately gated; AUTO PAPER is the validation path
