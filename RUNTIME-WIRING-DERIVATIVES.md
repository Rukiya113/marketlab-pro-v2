# Runtime Wiring + Derivatives Rework

Fixes the UI/runtime gaps found during manual inspection:
- interactive ASURA Context / Setup / Execution / Strategies / Derivatives / Sentinel tabs
- explicit ASURA Derivatives view
- typed Index Options + Index Futures universe
- expiry and contract table
- Paper derivative ticket component
- Settings-backed Paper broker configuration endpoint
- no fabricated derivative instruments or prices

Important:
The Upstox derivative instrument master is not yet loaded, therefore the derivative universe correctly
shows OFFLINE/empty until live integration. This package exposes the workflow and contracts without
inventing NIFTY strikes, expiries, lot sizes, futures or Greeks.

The existing compact home ASURA component can be replaced with AsuraInteractive in the final layout
integration after confirming the host component's exact props/layout contract.
