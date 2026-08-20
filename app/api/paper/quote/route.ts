import { NextRequest, NextResponse } from 'next/server';
import { paperBroker } from '@/lib/paper/singleton';
import type { PaperQuote } from '@/lib/paper/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const quote = (await request.json()) as PaperQuote;
  paperBroker.ingestQuote(quote);
  return NextResponse.json({ ok: true });
}
