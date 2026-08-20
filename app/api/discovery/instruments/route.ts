import { NextRequest, NextResponse } from 'next/server';
import { searchCatalog } from '@/lib/discovery/catalog';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';
  return NextResponse.json({ instruments: searchCatalog(q) }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
