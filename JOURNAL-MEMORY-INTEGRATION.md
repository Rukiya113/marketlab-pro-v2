# MarketLab Journal + Memory

Implemented:
- typed decision journal
- ASURA decision capture
- opportunity capture
- Sentinel / Portfolio decision capture
- Paper trade capture
- deduplication of completed paper trades
- MAE / MFE / P&L storage
- strategy / regime / instrument tags
- counter-thesis storage
- journal filtering
- strategy expectancy aggregation
- regime aggregation
- strategy × regime × instrument aggregation
- honest zero-sample behavior
- `/journal`
- `/memory`
- `/api/journal/entries`
- `/api/journal/memory`
- `/api/journal/capture`
- `/api/journal/reset`

The memory layer computes statistics only from completed captured trade outcomes.
It does not invent expectancy, win-rate, calibration or historical edge.

Runtime capture contract:
POST /api/journal/capture
{ "kind": "INTELLIGENCE", "instrumentId": "...", "payload": intelligenceState }
or
{ "kind": "PAPER", "payload": paperBrokerSnapshot }

The next integration step is to have the Market Gateway / Paper Broker call the capture service
automatically after each material state transition, so Journal/Memory continue recording even if
the Journal page is not open.
