# MarketLab Paper Trading

This package implements the paper-execution subsystem.

Implemented:
- market / limit / stop / stop-limit paper orders
- explicit order lifecycle
- deterministic execution against ingested real canonical quotes
- stale-quote refusal
- configurable slippage estimate
- configurable charge estimate
- positions and average price
- partial direction reduction and reversal handling
- realized / unrealized / net P&L
- MAE / MFE tracking
- trade history
- paper account equity
- cancel endpoint
- reset endpoint
- paper state API
- paper order API
- paper quote-ingestion API
- full `/paper-trading` workspace

Important:
This subsystem is simulation only. It never sends orders to Upstox and never labels a paper fill
as a broker fill. If no canonical quote is available, an order remains WORKING rather than being
filled from fabricated data.

Future runtime integration:
The canonical market gateway should POST or directly call `paperBroker.ingestQuote()` for each
eligible live quote used by paper execution. ASURA/Sentinel/Portfolio should submit approved
ExecutionIntent values into the paper broker only while execution mode is PAPER.
