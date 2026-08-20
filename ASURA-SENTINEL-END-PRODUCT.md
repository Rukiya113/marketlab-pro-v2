# MarketLab Pro — ASURA + Strategies + Sentinel End-Product Rework

This overlay replaces the compressed ASURA/Sentinel foundation with separated, auditable modules.

## Intelligence chain
Canonical candles -> FeatureStore -> Context Brain (30m/15m) -> Setup Brain (5m) -> Execution Brain (1m) -> Strategy Competition -> ASURA Decision -> Opportunity Lifecycle.

## Strategies
- Trend Pullback Scalper
- Liquidity Sweep Reversal Scalper
- Breakout-Retest Scalper

Each strategy has its own eligibility, regime compatibility, evidence, blockers and score. Incompatible strategies are not averaged into the selected strategy.

## Sentinel
Sentinel is split into independent gates for data quality, feed freshness, signal freshness, anti-chase/R:R, spread, liquidity, option freshness, duplicate intents, cooldown, frequency, daily loss and expected value. Unknown required evidence returns WAIT instead of PASS.

## Portfolio Governor
Portfolio heat, correlated exposure, drawdown, concurrent positions and consecutive losses can block new risk and can reduce the risk multiplier.

## Safety
The package does not fabricate market prices, spread, option liquidity, expected value or historical expectancy. Missing downstream evidence remains null and Sentinel waits.

## Apply
Extract at the repository root, then run:

```bash
rm -rf .next
npm run verify
```

Do not commit until verify passes.
