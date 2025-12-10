import { redis } from "./upstash";

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

class CacheManager {
  private static instance: CacheManager;

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private generateKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : `cache:${key}`;
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const cached = await redis.get(cacheKey);

      if (cached) {
        // Handle corrupted cache entries
        if (cached === "[object Object]" || typeof cached !== "string") {
          console.warn(`[Cache] Corrupted cache entry for ${key}, clearing...`);
          await redis.del(cacheKey);
          return null;
        }
        return JSON.parse(cached as string);
      }
      return null;
    } catch (error) {
      console.warn(`[Cache] Failed to get ${key}:`, error);
      // Clear corrupted cache entry
      try {
        const cacheKey = this.generateKey(key, options.prefix);
        await redis.del(cacheKey);
      } catch (deleteError) {
        console.warn(`[Cache] Failed to clear corrupted entry ${key}:`, deleteError);
      }
      return null;
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const ttl = options.ttl || 300; // Default 5 minutes

      await redis.setex(cacheKey, ttl, JSON.stringify(value));
    } catch (error) {
      console.warn(`[Cache] Failed to set ${key}:`, error);
    }
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const fresh = await fetcher();

    // Cache the result
    await this.set(key, fresh, options);

    return fresh;
  }

  async invalidate(key: string, options: CacheOptions = {}): Promise<void> {
    try {
      const cacheKey = this.generateKey(key, options.prefix);
      await redis.del(cacheKey);
    } catch (error) {
      console.warn(`[Cache] Failed to invalidate ${key}:`, error);
    }
  }

  async invalidatePattern(pattern: string, options: CacheOptions = {}): Promise<void> {
    try {
      const searchPattern = this.generateKey(pattern, options.prefix);
      const keys = await redis.keys(searchPattern);

      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.warn(`[Cache] Failed to invalidate pattern ${pattern}:`, error);
    }
  }

  // Batch operations for better performance
  async mget<T>(keys: string[], options: CacheOptions = {}): Promise<(T | null)[]> {
    try {
      const cacheKeys = keys.map(key => this.generateKey(key, options.prefix));
      const results = await redis.mget(...cacheKeys);

      return results.map(result => {
        if (result) {
          try {
            return JSON.parse(result as string);
          } catch {
            return null;
          }
        }
        return null;
      });
    } catch (error) {
      console.warn(`[Cache] Failed to mget:`, error);
      return keys.map(() => null);
    }
  }

  async mset<T>(entries: Array<{ key: string; value: T }>, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || 300;
      const pipeline = redis.pipeline();

      entries.forEach(({ key, value }) => {
        const cacheKey = this.generateKey(key, options.prefix);
        pipeline.setex(cacheKey, ttl, JSON.stringify(value));
      });

      await pipeline.exec();
    } catch (error) {
      console.warn(`[Cache] Failed to mset:`, error);
    }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Cache duration constants
export const CACHE_DURATIONS = {
  STATS: 30, // 30 seconds - frequently updated
  LEADERBOARD: 60, // 1 minute - updated less frequently
  USER_PROFILE: 300, // 5 minutes - rarely changes
  MATCH_HISTORY: 120, // 2 minutes - grows over time
  ROOM_INFO: 10, // 10 seconds - real-time data
  NAME_RESOLUTION: 3600, // 1 hour - ENS/Basename rarely changes
} as const;

// Prefixes for different data types
export const CACHE_PREFIXES = {
  STATS: "stats",
  LEADERBOARD: "leaderboard",
  USER: "user",
  MATCH: "match",
  ROOM: "room",
  NAME: "name",
} as const;
