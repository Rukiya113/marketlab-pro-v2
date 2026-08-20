import { NextRequest, NextResponse } from 'next/server';
import { settingsStore } from '@/lib/settings/singleton';
import { paperBroker } from '@/lib/paper/singleton';
import type { MarketLabSettings } from '@/lib/settings/types';
export const dynamic = 'force-dynamic';
function applyPaper(settings: MarketLabSettings) {
  paperBroker.configure({ ...settings.paper, maxQuoteAgeMs: settings.options.maxQuoteAgeMs });
}
export async function GET() { return NextResponse.json(settingsStore.get(), { headers: { 'Cache-Control': 'no-store' } }); }
export async function PUT(request: NextRequest) {
  const body = await request.json() as Partial<MarketLabSettings>;
  const envelope = settingsStore.set(body);
  applyPaper(envelope.settings);
  return NextResponse.json(envelope);
}
