import { NextResponse } from 'next/server';
import { paperBroker } from '@/lib/paper/singleton';

export const dynamic = 'force-dynamic';

export async function POST() {
  paperBroker.reset();
  return NextResponse.json({ ok: true, mode: 'PAPER' });
}
