import { NextResponse } from 'next/server';
import { getSessionState } from '@/lib/upstox/session';

export async function GET() {
  const state = await getSessionState();
  return NextResponse.json({
    connected: state === 'CONNECTED',
    state,
    feed: state === 'CONNECTED' ? 'CONNECTING' : 'OFFLINE',
  });
}
