# MarketLab Broker Connection Manager

This build adds persistent Upstox session management for MarketLab Pro V2.

- One-time server-side broker configuration via `.env.local`.
- OAuth and manual-token connection modes.
- Valid tokens are persisted to Redis when `REDIS_URL` is configured.
- A local encrypted fallback is stored in `.marketlab/upstox-session.json` and is gitignored.
- Encryption uses `MARKETLAB_SESSION_SECRET` when configured, otherwise the server-side `UPSTOX_CLIENT_SECRET`.
- MarketLab automatically restores a still-valid token on startup.
- `/settings/broker` provides connection, status, manual-token fallback, and disconnect controls.
- `/api/upstox/bootstrap` validates the restored session with Upstox.
- OAuth post-callback redirects use the configured external redirect origin, avoiding Codespaces internal-port redirects.

Important: MarketLab cannot extend an Upstox token beyond Upstox's own expiry policy. When the broker requires reauthorization, MarketLab reports REAUTH_REQUIRED and provides one-click reconnect.
