import { NextRequest, NextResponse } from 'next/server';
import type { RuntimeMarketQuote } from '@/lib/integration/contracts';
import { runtimeIntegration } from '@/lib/integration/singleton';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const quote = await request.json() as RuntimeMarketQuote;
  runtimeIntegration.onMarketQuote(quote);
  return NextResponse.json({ ok: true, mode: 'PAPER_BRIDGE' });
}
