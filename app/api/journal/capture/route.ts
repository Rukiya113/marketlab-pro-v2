import { NextRequest, NextResponse } from 'next/server';
import type { CanonicalInstrumentId } from '@/lib/market/events';
import {
  captureIntelligencePayload,
  capturePaperSnapshot,
} from '@/lib/journal/capture';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body?.kind === 'INTELLIGENCE') {
    captureIntelligencePayload(
      body.instrumentId as CanonicalInstrumentId,
      body.payload,
    );

    return NextResponse.json({ ok: true });
  }

  if (body?.kind === 'PAPER') {
    capturePaperSnapshot(body.payload);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { error: 'Unsupported capture kind' },
    { status: 400 },
  );
}
