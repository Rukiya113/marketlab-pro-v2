import { createClient, type RedisClientType } from 'redis';

let client: RedisClientType | null = null;
let connectionPromise: Promise<RedisClientType> | null = null;

function getRedisUrl(): string | null {
  const value = process.env.REDIS_URL?.trim();
  return value || null;
}

async function connectRedis(): Promise<RedisClientType | null> {
  const redisUrl = getRedisUrl();

  if (!redisUrl) {
    return null;
  }

  if (client?.isOpen) {
    return client;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const nextClient = createClient({
    url: redisUrl,
  });

  nextClient.on('error', (error) => {
    console.error('[MarketLab Redis]', error);
  });

  connectionPromise = nextClient
    .connect()
    .then(() => {
      client = nextClient as RedisClientType;
      return client;
    })
    .finally(() => {
      connectionPromise = null;
    });

  return connectionPromise;
}

export async function withRedis<T>(
  operation: (redis: RedisClientType) => Promise<T>,
  fallback: T,
): Promise<T> {
  const redis = await connectRedis();

  if (!redis) {
    return fallback;
  }

  try {
    return await operation(redis);
  } catch (error) {
    console.error('[MarketLab Redis operation]', error);
    return fallback;
  }
}

export async function getRedisClient(): Promise<RedisClientType | null> {
  return connectRedis();
}

export async function closeRedis(): Promise<void> {
  if (!client?.isOpen) {
    client = null;
    return;
  }

  await client.quit();
  client = null;
}