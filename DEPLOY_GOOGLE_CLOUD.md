# Google Cloud deployment

Deploy the web UI and market gateway as separate Cloud Run services. The gateway must remain server-side and long-running; do not move the Upstox feed into the browser.

## Required services
- Cloud Run: `marketlab-pro-web`
- Cloud Run: `marketlab-pro-gateway` with minimum instances set to 1 while the market feed must stay connected
- Redis: Google Cloud Memorystore (private VPC access required from both Cloud Run services)
- PostgreSQL: Cloud SQL for PostgreSQL
- Secret Manager: Upstox client ID/client secret and database credentials

## Web environment
`UPSTOX_CLIENT_ID`, `UPSTOX_CLIENT_SECRET`, `UPSTOX_REDIRECT_URI`, `NEXT_PUBLIC_APP_URL`, `REDIS_URL`, `DATABASE_URL`.

Register the exact deployed `/api/upstox/callback` URL in the Upstox developer console.

## Gateway environment
`REDIS_URL`. The gateway obtains the short-lived Upstox access token from Redis after OAuth; do not inject access tokens into source code or browser environment variables.

## Images
Web: build with root `Dockerfile`.
Gateway: build with `services/market-gateway/Dockerfile` using repository root as build context.

Before live deployment run `npm run verify`. Keep LIVE_AUTONOMOUS disabled until Paper, Sandbox, reconciliation and risk validation pass.
