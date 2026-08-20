# MarketLab Market Discovery

Completes the previously lightweight Explorer, Watchlist, Indices and Strategies routes.

- shared typed instrument catalog
- search
- selected-instrument handoff to WorkstationProvider
- watchlist add/remove API
- persistent runtime watchlist store
- index-focused view
- strategy-definition workspace
- no fabricated prices while canonical market data is offline

The initial catalog intentionally contains only canonical instruments already represented by the project.
Universal instrument discovery should be populated from the Upstox instrument master during the live-data integration pass.
