# MarketLab End-to-End Runtime Integration

This layer connects existing verified subsystems without inventing market state.

Implemented:
- Settings -> typed runtime policy
- canonical quote -> Paper Broker bridge
- automatic Paper snapshot -> Journal capture
- intelligence state -> Journal capture
- runtime policy API
- integration quote API
- integration intelligence API

Important safety boundary:
- executionMode LIVE is represented in settings but this integration does not send live broker orders.
- only PAPER bridge behavior is implemented here.
- SANDBOX/LIVE require a separately audited broker adapter.
- no missing option quote, Sentinel approval, or Portfolio approval is synthesized.

The Market Gateway can call these integration endpoints or share the same bridge contracts when
the final Upstox runtime activation is performed.
