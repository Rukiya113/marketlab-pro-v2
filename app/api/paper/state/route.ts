import { NextResponse } from 'next/server';
import { paperBroker } from '@/lib/paper/singleton';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(paperBroker.snapshot(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
