import { NextRequest, NextResponse } from 'next/server';
import type { CanonicalInstrumentId } from '@/lib/market/events';
import { buildSystemPulse } from '@/lib/diagnostics/pulse';
import { withRedis } from '@/lib/server/redis';
import { paperBroker } from '@/lib/paper/singleton';
import { buildMemory } from '@/lib/journal/memory';
import { journalStore } from '@/lib/journal/singleton';

export const dynamic = 'force-dynamic';

function parseJson(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const instrumentId = (
    request.nextUrl.searchParams.get('instrument') ??
    'IN:NSE:INDEX:NIFTY50'
  ) as CanonicalInstrumentId;

  const redisState = await withRedis(
    async (redis) => {
      const [gatewayRaw, intelligenceRaw] = await Promise.all([
        redis.get('marketlab:gateway:status'),
        redis.get(`marketlab:intelligence:${instrumentId}`),
      ]);

      return {
        gateway: parseJson(gatewayRaw),
        intelligence: parseJson(intelligenceRaw),
      };
    },
    {
      gateway: null,
      intelligence: null,
    },
  );

  const pulse = buildSystemPulse({
    gateway: redisState.gateway,
    intelligence: redisState.intelligence,
    paper: paperBroker.snapshot() as unknown as Record<string, unknown>,
    memory: buildMemory(journalStore.all()) as unknown as Record<string, unknown>,
  });

  return NextResponse.json(pulse, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
