# MarketLab X-RAY

This package adds the X-RAY analysis subsystem over the existing canonical candle feed.

Implemented:
- HH / HL / LH / LL swing structure
- BOS / CHOCH
- buy-side / sell-side liquidity
- equal highs / equal lows
- session high / session low
- recent liquidity sweep detection
- order-flow proxy and participation
- displacement
- bullish / bearish FVG detection
- FVG mitigation tracking
- volume profile / POC / value area
- X-RAY heatmap aggregation
- live updates from `/api/market/stream`
- standalone `/xray` workspace
- honest insufficient-evidence state

The package does not create a second data feed and does not fabricate prices, structure, liquidity, FVGs or volume nodes.
