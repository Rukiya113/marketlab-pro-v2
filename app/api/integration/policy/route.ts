import { NextResponse } from 'next/server';
import { getRuntimePolicy } from '@/lib/integration/policy';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getRuntimePolicy(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
