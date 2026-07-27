export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  activeEntries: number;
  keys: Array<{
    key: string;
    createdAt: string;
    expiresAt: string;
    ttlRemainingSeconds: number;
    sizeBytes: number;
  }>;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

class ServerCacheStore {
  private store = new Map<string, CacheEntry<unknown>>();
  private hits = 0;
  private misses = 0;

  constructor() {
    // Periodically prune expired entries every 30 seconds
    if (typeof setInterval !== "undefined") {
      setInterval(() => this.purgeExpired(), 30 * 1000).unref?.();
    }
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  public get<T>(key: string): { data: T; timestamp: number; expiresAt: number; ttlRemainingSeconds: number } | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    const now = Date.now();
    if (now >= entry.expiresAt) {
      // Entry expired: auto delete & return null
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    const ttlRemainingSeconds = Math.max(0, Math.ceil((entry.expiresAt - now) / 1000));
    return {
      data: entry.data as T,
      timestamp: entry.timestamp,
      expiresAt: entry.expiresAt,
      ttlRemainingSeconds,
    };
  }

  public set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
    const now = Date.now();
    this.store.set(key, {
      key,
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
    });
  }

  public delete(key: string): boolean {
    return this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }

  public async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = DEFAULT_TTL_MS
  ): Promise<{ data: T; source: "cache" | "api"; timestamp: number; expiresAt: number; ttlRemainingSeconds: number }> {
    const cached = this.get<T>(key);
    if (cached) {
      return {
        data: cached.data,
        source: "cache",
        timestamp: cached.timestamp,
        expiresAt: cached.expiresAt,
        ttlRemainingSeconds: cached.ttlRemainingSeconds,
      };
    }

    // Cache miss or expired: fetch fresh data from API
    const freshData = await fetcher();
    const now = Date.now();
    const expiresAt = now + ttlMs;

    this.set(key, freshData, ttlMs);

    return {
      data: freshData,
      source: "api",
      timestamp: now,
      expiresAt,
      ttlRemainingSeconds: Math.ceil(ttlMs / 1000),
    };
  }

  public getStats(): CacheStats {
    this.purgeExpired();
    const now = Date.now();

    const keysInfo = Array.from(this.store.values()).map((entry) => {
      const remainingSec = Math.max(0, Math.ceil((entry.expiresAt - now) / 1000));
      return {
        key: entry.key,
        createdAt: new Date(entry.timestamp).toISOString(),
        expiresAt: new Date(entry.expiresAt).toISOString(),
        ttlRemainingSeconds: remainingSec,
        sizeBytes: JSON.stringify(entry.data).length,
      };
    });

    return {
      hits: this.hits,
      misses: this.misses,
      activeEntries: this.store.size,
      keys: keysInfo,
    };
  }
}

// Global singleton to persist across server HMR in dev mode
const globalForCache = globalThis as unknown as { serverCache?: ServerCacheStore };
export const serverCache = globalForCache.serverCache ?? new ServerCacheStore();
if (process.env.NODE_ENV !== "production") {
  globalForCache.serverCache = serverCache;
}
