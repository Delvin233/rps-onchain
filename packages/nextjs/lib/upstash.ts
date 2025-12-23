import { Redis } from "@upstash/redis";

// Check if Upstash Redis environment variables are available
const hasRedisConfig = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

// Create the actual Redis instance when available
const redisInstance = hasRedisConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Create a fallback mock that implements the Redis interface
const createRedisFallback = (): Redis => {
  return {
    // Fallback methods that do nothing when Redis isn't available
    get: async () => null,
    set: async () => "OK" as any,
    setex: async () => "OK" as any,
    del: async () => 0,
    keys: async () => [],
    lrange: async () => [],
    lpush: async () => 0,
    ltrim: async () => "OK" as any,
    exists: async () => 0,
    expire: async () => 1,
    // Additional methods used throughout the codebase
    llen: async () => 0,
    ping: async () => "PONG" as any,
    mget: async () => [],
    pipeline: () => ({
      get: () => ({ pipeline: () => ({}) }),
      set: () => ({ pipeline: () => ({}) }),
      setex: () => ({ pipeline: () => ({}) }),
      del: () => ({ pipeline: () => ({}) }),
      exec: async () => [],
    }),
    evalsha: async () => null,
  } as unknown as Redis;
};

// Export the redis instance (either real or fallback)
export const redis: Redis = redisInstance || createRedisFallback();

// Helper to check if caching is available
export const isCacheAvailable = hasRedisConfig;
