import { createClient } from 'redis';
import { randomUUID } from 'node:crypto';
import UpstoxClient = require('upstox-js-sdk');
import { CORE_INSTRUMENTS } from '../../../lib/market/instruments';
import type { CanonicalMarketEvent, DataQualityState, GatewayStatusEvent, CanonicalCandle } from '../../../lib/market/events';
import { normalize } from './normalize';
import { CandleEngine } from './candles';
import { IntelligenceRuntime } from './intelligence-runtime';
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error('REDIS_URL is required');
const redis = createClient({ url: redisUrl });
const candleEngine = new CandleEngine();
const intelligence = new IntelligenceRuntime(redis);
let streamer: any = null;
let tokenInUse = '';
let lastTickAt = 0;
let quality: DataQualityState = 'OFFLINE';
async function publish(event: CanonicalMarketEvent) {
  const raw = JSON.stringify(event);
  await redis.publish('marketlab:events', raw);
  if (event.type === 'TICK') { lastTickAt = Date.now(); await redis.set(`marketlab:tick:${event.instrumentId}`, raw, { EX: 30 }); }
  if (event.type === 'CANDLE') { const key = `marketlab:candles:${event.instrumentId}:${event.interval}`; await redis.lPush(key, raw); await redis.lTrim(key, 0, 799); await redis.expire(key, 86400 * 14); }
}
async function status(state: GatewayStatusEvent['state'], detail?: string) {
  const event: GatewayStatusEvent = { type: 'GATEWAY_STATUS', eventId: randomUUID(), state, at: Date.now(), detail };
  quality = state === 'LIVE' ? 'HEALTHY' : 'OFFLINE';
  await redis.set('marketlab:gateway:status', JSON.stringify({ state, quality, at: event.at, detail }), { EX: 60 });
  await publish(event);
}
async function onCandle(candle: CanonicalCandle) { const feedAgeMs = lastTickAt ? Date.now() - lastTickAt : null; await intelligence.onCandle(candle, quality, feedAgeMs); }
async function connect(token: string) {
  tokenInUse = token;
  await status('CONNECTING');
  const client = UpstoxClient.ApiClient.instance;
  client.authentications['OAUTH2'].accessToken = token;
  streamer = new UpstoxClient.MarketDataStreamerV3(CORE_INSTRUMENTS.map((instrument) => instrument.upstoxKey), 'full');
  streamer.autoReconnect(true, 5, 20);
  streamer.on('open', () => void status('LIVE'));
  streamer.on('reconnecting', () => void status('RECONNECTING'));
  streamer.on('close', () => void status('OFFLINE', 'Upstox socket closed'));
  streamer.on('error', (error: any) => void status('ERROR', String(error?.message ?? error)));
  streamer.on('message', (data: any) => { void (async () => { for (const tick of normalize(data)) { await publish(tick); for (const candle of candleEngine.onTick(tick)) { await publish(candle); await onCandle(candle); } } })(); });
  streamer.connect();
}
async function loop() {
  await redis.connect();
  await status('WAITING_FOR_TOKEN', 'Connect Upstox in the web app');
  setInterval(async () => {
    const token = await redis.get('marketlab:upstox:access-token');
    if (!token) { if (streamer) { try { streamer.disconnect(); } catch {} streamer = null; tokenInUse = ''; } await status('WAITING_FOR_TOKEN', 'Connect Upstox in the web app'); return; }
    if (token !== tokenInUse) { if (streamer) { try { streamer.disconnect(); } catch {} } await connect(token); }
  }, 5000);
  setInterval(async () => {
    if (!lastTickAt) return;
    const age = Date.now() - lastTickAt;
    const next: DataQualityState = age < 5000 ? 'HEALTHY' : age < 15000 ? 'DEGRADED' : age < 30000 ? 'STALE' : 'OFFLINE';
    if (next !== quality) { quality = next; await publish({ type: 'DATA_QUALITY', eventId: randomUUID(), state: quality, at: Date.now(), latencyMs: age, reason: age > 5000 ? `Last tick ${age} ms ago` : undefined }); }
  }, 2000);
}
loop().catch((error) => { console.error(error); process.exit(1); });
