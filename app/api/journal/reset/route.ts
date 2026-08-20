import { NextResponse } from 'next/server';
import { journalStore } from '@/lib/journal/singleton';

export const dynamic = 'force-dynamic';

export async function POST() {
  journalStore.clear();
  return NextResponse.json({ ok: true });
}
