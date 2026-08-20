import { paperBroker } from '@/lib/paper/singleton';
import type { RuntimeMarketQuote } from './contracts';

export function ingestCanonicalQuoteIntoPaper(quote: RuntimeMarketQuote): void {
  paperBroker.ingestQuote({
    instrumentId: quote.instrumentId,
    bid: quote.bid,
    ask: quote.ask,
    last: quote.last,
    timestamp: quote.at,
  });
}
