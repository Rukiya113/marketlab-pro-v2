import { NextRequest, NextResponse } from 'next/server';
import type { CanonicalInstrumentId } from '@/lib/market/events';
import { journalStore } from '@/lib/journal/singleton';
import type { JournalEntryKind } from '@/lib/journal/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const instrument = request.nextUrl.searchParams.get('instrument');
  const strategy = request.nextUrl.searchParams.get('strategy') ?? undefined;
  const kind = request.nextUrl.searchParams.get('kind') as JournalEntryKind | null;
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '250');

  const entries = journalStore.list({
    instrumentId: instrument
      ? (instrument as CanonicalInstrumentId)
      : undefined,
    strategy,
    kind: kind ?? undefined,
    limit: Number.isFinite(limit) ? limit : 250,
  });

  return NextResponse.json({ entries, count: entries.length }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const entry = journalStore.append(body);
  return NextResponse.json(entry, { status: 201 });
}
