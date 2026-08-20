# MarketLab Diagnostics + System Pulse

Implemented:
- Market Gateway health
- canonical-candle readiness
- ASURA readiness
- Opportunity Engine state
- Sentinel state
- Portfolio Governor state
- Paper Broker availability
- Journal / Memory observation count
- last-event age
- latency field support
- blocking/non-blocking classification
- analysis-readiness flag
- paper-execution-readiness flag
- active blocker list
- `/api/diagnostics/pulse`
- `/diagnostics`

The diagnostics layer never turns missing runtime state into HEALTHY.
If Redis / Gateway / ASURA evidence is unavailable, it reports OFFLINE / BLOCKED / UNKNOWN.

This subsystem reads the existing runtime stores and does not create another market-data path.
