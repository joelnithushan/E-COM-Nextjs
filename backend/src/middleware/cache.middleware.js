import { getCache, setCache, cacheKey } from '../utils/cache.util.js';

/**
 * Cache middleware for Express routes
 * 
 * Usage:
 * router.get('/products', cacheMiddleware(300), getProducts);
 * 
 * @param {Number} ttlSeconds - Time to live in seconds
 * @param {Function} keyGenerator - Optional function to generate cache key from request
 */
export const cacheMiddleware = (ttlSeconds = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const key = keyGenerator
      ? keyGenerator(req)
      : cacheKey('route', req.path, JSON.stringify(req.query), JSON.stringify(req.params));

    try {
      // Try to get from cache
      const cached = await getCache(key);
      if (cached !== null) {
        // Set cache headers
        res.set('X-Cache', 'HIT');
        return res.json(cached);
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (data) {
        // Cache the response
        setCache(key, data, ttlSeconds).catch((err) => {
          console.error('Cache set error:', err);
        });

        // Set cache headers
        res.set('X-Cache', 'MISS');
        return originalJson(data);
      };

      next();
    } catch (error) {
      // If caching fails, continue without cache
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Cache invalidation middleware
 * Invalidates cache on POST/PUT/DELETE requests
 */
export const cacheInvalidation = (pattern = null) => {
  return async (req, res, next) => {
    // Only invalidate on write operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      try {
        const { delCachePattern } = await import('../utils/cache.util.js');
        
        if (pattern) {
          await delCachePattern(pattern);
        } else {
          // Default: invalidate route-specific cache
          const routePattern = `route:${req.baseUrl || ''}${req.path}*`;
          await delCachePattern(routePattern);
        }
      } catch (error) {
        console.error('Cache invalidation error:', error);
      }
    }
    next();
  };
};



