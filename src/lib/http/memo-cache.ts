type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export class MemoCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() >= entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { value, expiresAt });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  async withCache<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fn();
    this.set(key, value, ttlMs);
    return value;
  }

  // Cleanup expired entries (call periodically if needed)
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    this.cache.forEach((entry, key) => {
      if (now >= entry.expiresAt) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => {
      this.cache.delete(key);
    });
  }
}

// Global cache instance
export const globalCache = new MemoCache();

// Periodic cleanup every 5 minutes
if (typeof window !== "undefined") {
  setInterval(() => {
    globalCache.cleanup();
  }, 5 * 60 * 1000);
}

