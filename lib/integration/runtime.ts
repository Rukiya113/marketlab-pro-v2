import type { CanonicalInstrumentId } from '@/lib/market/events';
import { captureRuntimeIntelligence, captureRuntimePaperState } from './journalBridge';
import { ingestCanonicalQuoteIntoPaper } from './paperBridge';
import type { RuntimeMarketQuote } from './contracts';

export class MarketLabRuntimeIntegration {
  onMarketQuote(quote: RuntimeMarketQuote): void {
    ingestCanonicalQuoteIntoPaper(quote);
    captureRuntimePaperState();
  }

  onIntelligenceState(
    instrumentId: CanonicalInstrumentId,
    payload: unknown,
  ): void {
    captureRuntimeIntelligence(instrumentId, payload);
  }
}
