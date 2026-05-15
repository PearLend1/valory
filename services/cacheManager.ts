/**
 * Cache Manager
 * Handles TTL-based caching for EPC and Overpass API results
 * Uses in-memory cache with database persistence option
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number; // Unix timestamp
  createdAt: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.startCleanupInterval();
  }

  /**
   * Get cached value if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached value with TTL in seconds
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, {
      data,
      expiresAt,
      createdAt: Date.now(),
    });
  }

  /**
   * Delete cached value
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries: any[] = [];
    this.cache.forEach((entry, key) => {
      entries.push({
        key,
        expiresIn: Math.max(0, Math.round((entry.expiresAt - Date.now()) / 1000)),
        age: Math.round((Date.now() - entry.createdAt) / 1000),
      });
    });
    return {
      size: this.cache.size,
      entries,
    };
  }

  /**
   * Periodically clean up expired entries
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      const keysToDelete: string[] = [];

      this.cache.forEach((entry, key) => {
        if (now > entry.expiresAt) {
          keysToDelete.push(key);
          cleaned++;
        }
      });

      keysToDelete.forEach(key => this.cache.delete(key));

      if (cleaned > 0) {
        console.log(`[Cache Manager] Cleaned up ${cleaned} expired entries`);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Stop cleanup interval (for graceful shutdown)
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

/**
 * Cache key generators for consistent key naming
 */
export const cacheKeys = {
  /**
   * EPC lookup cache key (7-day TTL)
   * Format: epc:postcode:{postcode}
   */
  epcPostcode: (postcode: string) => `epc:postcode:${postcode.replace(/\s+/g, '').toUpperCase()}`,

  /**
   * EPC LMK-key cache key (7-day TTL)
   * Format: epc:lmk:{lmkKey}
   */
  epcLmkKey: (lmkKey: string) => `epc:lmk:${lmkKey}`,

  /**
   * Overpass amenity cache key (30-day TTL)
   * Format: osm:amenities:{lat}:{lng}:{radius}
   */
  osmAmenities: (lat: number, lng: number, radius: number) => 
    `osm:amenities:${lat.toFixed(6)}:${lng.toFixed(6)}:${radius}`,
};

/**
 * Cache TTL constants (in seconds)
 */
export const CACHE_TTL = {
  EPC: 7 * 24 * 60 * 60,        // 7 days
  OSM_AMENITIES: 30 * 24 * 60 * 60, // 30 days
  VALUATION: 24 * 60 * 60,      // 1 day
};

/**
 * Wrapper function for cached EPC lookups
 */
export async function getCachedEPC<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.EPC
): Promise<T> {
  // Try cache first
  const cached = cacheManager.get<T>(key);
  if (cached !== null) {
    console.log(`[Cache] Hit for ${key}`);
    return cached;
  }

  // Fetch and cache
  console.log(`[Cache] Miss for ${key}, fetching...`);
  const data = await fetcher();
  cacheManager.set(key, data, ttl);
  return data;
}

/**
 * Wrapper function for cached Overpass lookups
 */
export async function getCachedOverpass<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.OSM_AMENITIES
): Promise<T> {
  // Try cache first
  const cached = cacheManager.get<T>(key);
  if (cached !== null) {
    console.log(`[Cache] Hit for ${key}`);
    return cached;
  }

  // Fetch and cache
  console.log(`[Cache] Miss for ${key}, fetching...`);
  const data = await fetcher();
  cacheManager.set(key, data, ttl);
  return data;
}
