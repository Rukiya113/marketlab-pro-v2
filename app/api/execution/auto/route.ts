import { NextRequest, NextResponse } from 'next/server';
import type { CanonicalInstrumentId } from '@/lib/market/events';
import { withRedis } from '@/lib/server/redis';
import { emptyIntelligenceState, type IntelligenceStatePayload } from '@/lib/intelligence/serialize';
import { runAutoPaper } from '@/lib/execution/autoOrchestrator';
export const dynamic='force-dynamic';
export async function POST(request:NextRequest){const body=await request.json() as {instrumentId:CanonicalInstrumentId};const fallback=emptyIntelligenceState();const state=await withRedis<IntelligenceStatePayload>(async redis=>{const raw=await redis.get(`marketlab:intelligence:${body.instrumentId}`);return raw?JSON.parse(raw) as IntelligenceStatePayload:fallback},fallback);return NextResponse.json(runAutoPaper(body.instrumentId,state))}
