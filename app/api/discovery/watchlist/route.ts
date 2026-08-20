import { NextRequest, NextResponse } from 'next/server';
import type { CanonicalInstrumentId } from '@/lib/market/events';
import { watchlistStore } from '@/lib/discovery/singleton';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ items: watchlistStore.list() }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { instrumentId: CanonicalInstrumentId };
  return NextResponse.json(watchlistStore.add(body.instrumentId), { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const instrumentId = request.nextUrl.searchParams.get('instrument') as CanonicalInstrumentId | null;
  if (!instrumentId) {
    return NextResponse.json({ error: 'instrument is required' }, { status: 400 });
  }
  return NextResponse.json({ removed: watchlistStore.remove(instrumentId) });
}
