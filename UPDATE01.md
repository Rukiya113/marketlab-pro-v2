# MarketLab Update 01

Adds the first product-layer completion pass to the verified MarketLab repository:
- MarketLab Light default theme plus Professional, Soft Contrast, Terminal Dark
- persistent theme setting
- shared selected-instrument/workspace state
- Explorer selection controls the central workstation and ASURA
- dynamic chart instrument/timeframe (removes hard-coded NIFTY-only chart)
- Chart / X-RAY / Split / Options / Trades workspace tabs
- Scanner workspace using canonical ASURA/intelligence state only
- Scanner-to-workstation handoff
- ASURA compact distinguishes live feed from intelligence readiness
- improved System Pulse/quality/context presentation

No demo prices, scanner rows, opportunities, or ASURA signals are fabricated.

Apply from repository root:

    unzip -o marketlab-update-01-ui-scanner.zip
    rm marketlab-update-01-ui-scanner.zip
    npm run verify

Only commit/push after verify passes.
