# MarketLab Pro - Green/White Workstation UI Update

This package is a complete replacement of the previously verified realtime-core package.

## UI changes
- Green/white professional terminal theme.
- Brand and primary navigation moved to the top header.
- Settings, ASURA, Upstox status and Paper Trading mode in the header.
- Expandable Explorer on the left with Indices, Sectors and Stocks.
- Central workstation tabs: Workspace, Chart, X-RAY, Orders, Positions, Holdings, Alerts and Journal.
- Realtime canonical NIFTY candle chart retained.
- X-RAY split below the chart with Structure/Liquidity/Orderflow/Heatmap/FVG/Volume Profile controls.
- ASURA Agent on the right with Overview/Thesis/Context/Setups/Execution/Journal tabs, Market Pulse, Pulse System and activity.
- Bottom System Pulse, Positions, Orders and News/Events deck.

## Data integrity
No example prices, fake candles, fake ASURA confidence values, fake positions or fake orders are inserted. Offline data renders as dash/OFFLINE/WAITING. Existing canonical market SSE and Upstox OAuth paths are retained.

## Verify after pushing to GitHub/Codespaces/Cloud Shell

```bash
npm install
npm run verify
```

The previous baseline was verified by the user in Google Cloud Shell. This UI revision could not be fully recompiled in the artifact environment because npm dependency installation timed out, so run `npm run verify` before deployment.
