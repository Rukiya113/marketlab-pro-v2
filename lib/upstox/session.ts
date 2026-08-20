import { cookies } from 'next/headers';

const TOKEN = 'mlp_upstox_token';
const ISSUED = 'mlp_upstox_issued_at';

/**
 * Upstox V2 access tokens are not refreshable - they expire daily at 03:30 IST
 * regardless of when they were issued. We store the issue time alongside the
 * token so the UI can distinguish "never connected" from "session expired,
 * please reconnect" instead of showing a bare OFFLINE state for both.
 */
export function nextExpiryFrom(issuedAtMs: number): number {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const issuedIst = new Date(issuedAtMs + IST_OFFSET_MS);
  const expiryIst = new Date(Date.UTC(issuedIst.getUTCFullYear(), issuedIst.getUTCMonth(), issuedIst.getUTCDate(), 3, 30, 0));
  if (issuedIst.getUTCHours() > 3 || (issuedIst.getUTCHours() === 3 && issuedIst.getUTCMinutes() >= 30)) {
    expiryIst.setUTCDate(expiryIst.getUTCDate() + 1);
  }
  return expiryIst.getTime() - IST_OFFSET_MS;
}

export async function setToken(token: string) {
  const jar = await cookies();
  const now = Date.now();
  const expiresAt = nextExpiryFrom(now);
  const maxAge = Math.max(60, Math.floor((expiresAt - now) / 1000));
  const common = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge };
  jar.set(TOKEN, token, common);
  jar.set(ISSUED, String(now), common);
}

export async function getToken() {
  return (await cookies()).get(TOKEN)?.value ?? null;
}

export type SessionState = 'DISCONNECTED' | 'CONNECTED' | 'EXPIRED';

export async function getSessionState(): Promise<SessionState> {
  const jar = await cookies();
  const token = jar.get(TOKEN)?.value ?? null;
  if (!token) return 'DISCONNECTED';
  const issuedAt = Number(jar.get(ISSUED)?.value ?? 0);
  if (!issuedAt || Date.now() >= nextExpiryFrom(issuedAt)) return 'EXPIRED';
  return 'CONNECTED';
}

export async function clearToken() {
  const jar = await cookies();
  jar.delete(TOKEN);
  jar.delete(ISSUED);
}
