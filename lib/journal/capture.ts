import type { CanonicalInstrumentId } from '@/lib/market/events';
import { journalStore } from './singleton';

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === 'object'
    ? (value as AnyRecord)
    : null;
}

function stringValue(record: AnyRecord | null, key: string): string | null {
  const value = record?.[key];
  return typeof value === 'string' ? value : null;
}

function numberValue(record: AnyRecord | null, key: string): number | null {
  const value = record?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringArray(record: AnyRecord | null, key: string): string[] {
  const value = record?.[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

export function captureIntelligencePayload(
  instrumentId: CanonicalInstrumentId,
  payload: unknown,
): void {
  const root = asRecord(payload);
  const decision = asRecord(root?.decision);
  const opportunity = asRecord(root?.opportunity);
  const sentinel = asRecord(root?.sentinel);
  const portfolio = asRecord(root?.portfolio);

  if (decision) {
    journalStore.append({
      kind: 'ASURA_DECISION',
      instrumentId,
      strategy:
        stringValue(decision, 'selectedStrategy') ??
        stringValue(decision, 'strategy'),
      regime: stringValue(decision, 'regime'),
      direction: stringValue(decision, 'direction'),
      decision:
        stringValue(decision, 'action') ??
        stringValue(decision, 'state'),
      score:
        numberValue(decision, 'opportunityScore') ??
        numberValue(decision, 'score'),
      dataQuality: numberValue(decision, 'dataQuality'),
      counterThesis: stringArray(decision, 'counterThesis'),
      payload: decision,
    });
  }

  if (opportunity) {
    journalStore.append({
      kind: 'OPPORTUNITY',
      instrumentId,
      opportunityId:
        stringValue(opportunity, 'id') ??
        stringValue(opportunity, 'opportunityId'),
      strategy:
        stringValue(opportunity, 'strategy') ??
        stringValue(decision, 'selectedStrategy'),
      regime: stringValue(decision, 'regime'),
      direction:
        stringValue(opportunity, 'direction') ??
        stringValue(decision, 'direction'),
      decision: stringValue(opportunity, 'state'),
      score:
        numberValue(opportunity, 'score') ??
        numberValue(decision, 'opportunityScore'),
      payload: opportunity,
    });
  }

  if (sentinel) {
    journalStore.append({
      kind: 'SENTINEL',
      instrumentId,
      strategy: stringValue(decision, 'selectedStrategy'),
      regime: stringValue(decision, 'regime'),
      direction: stringValue(decision, 'direction'),
      decision:
        stringValue(sentinel, 'decision') ??
        stringValue(sentinel, 'state'),
      payload: sentinel,
    });
  }

  if (portfolio) {
    journalStore.append({
      kind: 'PORTFOLIO',
      instrumentId,
      strategy: stringValue(decision, 'selectedStrategy'),
      regime: stringValue(decision, 'regime'),
      decision:
        stringValue(portfolio, 'decision') ??
        stringValue(portfolio, 'state'),
      payload: portfolio,
    });
  }
}

export function capturePaperSnapshot(snapshot: unknown): void {
  const root = asRecord(snapshot);
  const trades = root?.trades;

  if (!Array.isArray(trades)) return;

  for (const rawTrade of trades) {
    const trade = asRecord(rawTrade);
    if (!trade) continue;

    const paperTradeId = stringValue(trade, 'id');
    const alreadyExists = journalStore
      .all()
      .some(
        (entry) =>
          entry.kind === 'PAPER_TRADE' &&
          paperTradeId != null &&
          entry.paperTradeId === paperTradeId,
      );

    if (alreadyExists) continue;

    journalStore.append({
      kind: 'PAPER_TRADE',
      instrumentId:
        stringValue(trade, 'instrumentId') as CanonicalInstrumentId | null,
      symbol: stringValue(trade, 'symbol'),
      strategy: stringValue(trade, 'strategy'),
      opportunityId: stringValue(trade, 'opportunityId'),
      paperTradeId,
      direction: stringValue(trade, 'side'),
      pnl:
        numberValue(trade, 'netPnl') ??
        numberValue(trade, 'grossPnl'),
      mae: numberValue(trade, 'mae'),
      mfe: numberValue(trade, 'mfe'),
      payload: trade,
      createdAt:
        numberValue(trade, 'closedAt') ??
        Date.now(),
    });
  }
}
