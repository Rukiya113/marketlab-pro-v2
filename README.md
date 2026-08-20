# MarketLab Pro - Green Workstation Edition

This is the complete MarketLab Pro realtime-core project updated to the approved green/white workstation UI.

See `UI_UPDATE.md` for the UI map and verification instructions.

# MarketLab Pro - Integrated Realtime Core

Complete replacement package based on the validated Milestone 1 UI/security baseline.

## Included
- Next.js 15 / React 19 terminal UI and full ASURA workspace shell
- Security headers, Upstox OAuth CSRF state, 03:30 IST session-expiry handling, logout origin guard
- Real routes instead of dead `#` navigation links
- Server-side Upstox token handoff to Redis (token is never exposed to browser JavaScript)
- Separate `services/market-gateway` long-running Node service using the official `upstox-js-sdk` MarketDataStreamerV3
- Canonical instrument identity and canonical market event schema
- Upstox V3 stream normalization into canonical ticks
- Realtime 1m/3m/5m/15m/30m/1h candle engine
- Redis pub/sub event bus + hot tick/candle state
- SSE browser bridge (`/api/market/stream`)
- Realtime NIFTY chart surface driven only by canonical candles; no fake prices
- Redis/Postgres local infrastructure and durable database schema foundations
- Dockerfiles for web and gateway

## Local run
1. Copy `.env.example` to `.env.local` and add your Upstox app credentials.
2. Start Redis/Postgres: `docker compose up -d redis postgres`.
3. Install dependencies: `npm install`.
4. Verify: `npm run verify`.
5. Start gateway in a second terminal after compiling it: `npm run gateway:build && node services/market-gateway/dist/services/market-gateway/src/index.js`.
6. Start web: `npm run dev`.
7. Open http://localhost:3000 and connect Upstox.

The OAuth callback stores the broker token in an httpOnly cookie for web session state and in Redis for the server-side gateway. Redis token TTL follows the Upstox daily session expiry calculation. No API secret or token is included in this archive.

## Safety state
OBSERVE/PAPER are the intended initial modes. LIVE_AUTONOMOUS is not enabled by this package. Order execution, reconciliation, Sentinel enforcement, Portfolio Governor enforcement, PaperBroker validation, and Upstox Sandbox validation must be completed before autonomous live execution.
