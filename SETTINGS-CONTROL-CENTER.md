# MarketLab Settings / Control Center

Implemented:
- centralized typed settings contract
- safe defaults
- server-side runtime settings store
- normalization and range validation
- ASURA thresholds
- strategy enable/disable controls
- Sentinel policy
- Portfolio Governor policy
- Options policy
- Paper Trading policy
- execution mode
- journal/diagnostics switches
- `/api/settings`
- `/api/settings/reset`
- full `/settings` workspace

Important:
This package centralizes configuration, but existing engines must explicitly read the SettingsStore
before a setting changes runtime behavior. It does not falsely claim every previously hard-coded
threshold is already dynamically bound.

The next integration pass should inject these policies into ASURA, Sentinel, Portfolio, Options and
Paper Broker constructors/runtime evaluation so the Control Center becomes authoritative.
