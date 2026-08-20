import { NextRequest, NextResponse } from 'next/server';
import { clearToken } from '@/lib/upstox/session';
import { removeGatewayToken } from '@/lib/upstox/token-store';

// Defense in depth on top of sameSite=lax: reject cross-origin POSTs outright.
function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // same-origin requests from same-site nav may omit Origin
  try {
    return new URL(origin).host === req.headers.get('host');
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  }
  await clearToken(); await removeGatewayToken();
  return NextResponse.json({ ok: true });
}
