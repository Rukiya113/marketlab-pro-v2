import { NextResponse } from 'next/server';
import { buildMemory } from '@/lib/journal/memory';
import { journalStore } from '@/lib/journal/singleton';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(buildMemory(journalStore.all()), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
