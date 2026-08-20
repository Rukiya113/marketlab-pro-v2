import { NextRequest, NextResponse } from 'next/server';
import type { CanonicalInstrumentId } from '@/lib/market/events';
import { withRedis } from '@/lib/server/redis';
import { emptyIntelligenceState, type IntelligenceStatePayload } from '@/lib/intelligence/serialize';
import { runAutoPaper } from '@/lib/execution/autoOrchestrator';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const instrument = (request.nextUrl.searchParams.get('instrument') ?? 'IN:NSE:INDEX:NIFTY50') as CanonicalInstrumentId;
  const key = `marketlab:intelligence:${instrument}`;
  const fallback = emptyIntelligenceState();
  const data = await withRedis<IntelligenceStatePayload>(async (redis) => {
    const raw = await redis.get(key); if (!raw) return fallback;
    try { return JSON.parse(raw) as IntelligenceStatePayload; } catch { return fallback; }
  }, fallback);
  const autoExecution = runAutoPaper(instrument, data);
  return NextResponse.json({ ...data, autoExecution }, { headers: { 'Cache-Control': 'no-store' } });
}
