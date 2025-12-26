/**
 * Cache Utility
 * Provides in-memory caching with optional Redis support
 * 
 * Trade-offs:
 * - In-memory: Fast, but lost on restart, single instance only
 * - Redis: Persistent, shared across instances, but requires Redis server
 */

// Simple in-memory cache (fallback if Redis not available)
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); // Time-to-live tracking
  }

  async get(key) {
    const ttl = this.ttl.get(key);
    if (ttl && Date.now() > ttl) {
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  async set(key, value, ttlSeconds = 300) {
    this.cache.set(key, value);
    if (ttlSeconds > 0) {
      this.ttl.set(key, Date.now() + ttlSeconds * 1000);
    }
  }

  async del(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  async clear() {
    this.cache.clear();
    this.ttl.clear();
  }
}

// Redis cache (if available)
let redisClient = null;
let memoryCache = new MemoryCache();

/**
 * Initialize cache (Redis or memory)
 */
export const initCache = async () => {
  // Try to use Redis if available
  if (process.env.REDIS_URL) {
    try {
      const redis = await import('redis');
      redisClient = redis.createClient({
        url: process.env.REDIS_URL,
      });

      redisClient.on('error', (err) => {
        console.warn('Redis connection error, falling back to memory cache:', err.message);
        redisClient = null;
      });

      await redisClient.connect();
      console.log('✅ Redis cache connected');
    } catch (error) {
      console.warn('⚠️  Redis not available, using memory cache:', error.message);
      redisClient = null;
    }
  }

  return redisClient || memoryCache;
};

/**
 * Get value from cache
 */
export const getCache = async (key) => {
  try {
    if (redisClient) {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    }
    return await memoryCache.get(key);
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

/**
 * Set value in cache
 */
export const setCache = async (key, value, ttlSeconds = 300) => {
  try {
    if (redisClient) {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } else {
      await memoryCache.set(key, value, ttlSeconds);
    }
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

/**
 * Delete value from cache
 */
export const delCache = async (key) => {
  try {
    if (redisClient) {
      await redisClient.del(key);
    } else {
      await memoryCache.del(key);
    }
  } catch (error) {
    console.error('Cache delete error:', error);
  }
};

/**
 * Delete multiple keys (pattern matching)
 */
export const delCachePattern = async (pattern) => {
  try {
    if (redisClient) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } else {
      // Memory cache: simple pattern matching
      for (const key of memoryCache.cache.keys()) {
        if (key.includes(pattern.replace('*', ''))) {
          await memoryCache.del(key);
        }
      }
    }
  } catch (error) {
    console.error('Cache pattern delete error:', error);
  }
};

/**
 * Clear all cache
 */
export const clearCache = async () => {
  try {
    if (redisClient) {
      await redisClient.flushDb();
    } else {
      await memoryCache.clear();
    }
  } catch (error) {
    console.error('Cache clear error:', error);
  }
};

/**
 * Generate cache key
 */
export const cacheKey = (prefix, ...parts) => {
  return `${prefix}:${parts.join(':')}`;
};

/**
 * Cache wrapper for async functions
 */
export const withCache = async (key, fn, ttlSeconds = 300) => {
  // Try to get from cache
  const cached = await getCache(key);
  if (cached !== null) {
    return cached;
  }

  // Execute function
  const result = await fn();

  // Store in cache
  await setCache(key, result, ttlSeconds);

  return result;
};

export default {
  initCache,
  getCache,
  setCache,
  delCache,
  delCachePattern,
  clearCache,
  cacheKey,
  withCache,
};



