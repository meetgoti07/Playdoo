// /lib/redis/redisClient.ts
import { createClient } from "redis";

declare global {
  // Declare globally for hot-reload safety in dev
  var _redisClient: ReturnType<typeof createClient> | undefined;
  var _redisClientConnecting: Promise<void> | null | undefined;
}

const globalForRedis = global as typeof globalThis & {
  _redisClient?: ReturnType<typeof createClient>;
  _redisClientConnecting?: Promise<void> | null;
};

if (!globalForRedis._redisClient) {
  globalForRedis._redisClient = createClient({
    url: process.env.REDIS_URL, // optional
  });
  globalForRedis._redisClientConnecting = null;
}

const redisClient = globalForRedis._redisClient;

export const getRedisClient = async () => {
  if (!redisClient.isOpen) {
    // Prevent multiple simultaneous connect() calls
    if (!globalForRedis._redisClientConnecting) {
      globalForRedis._redisClientConnecting = redisClient.connect().catch((err) => {
        console.error("❌ Redis connect error:", err);
        globalForRedis._redisClientConnecting = null;
        throw err;
      });
    }
    await globalForRedis._redisClientConnecting;
  }

  return redisClient;
};
