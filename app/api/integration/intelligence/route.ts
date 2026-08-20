import { NextRequest, NextResponse } from 'next/server';
import type { CanonicalInstrumentId } from '@/lib/market/events';
import { runtimeIntegration } from '@/lib/integration/singleton';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    instrumentId: CanonicalInstrumentId;
    payload: unknown;
  };

  runtimeIntegration.onIntelligenceState(body.instrumentId, body.payload);
  return NextResponse.json({ ok: true });
}
