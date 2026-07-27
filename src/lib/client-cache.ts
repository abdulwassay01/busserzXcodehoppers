"use client";

export interface ClientCacheEnvelope<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const DEFAULT_CLIENT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getClientCache<T>(key: string): { data: T; timestamp: number; ttlRemainingSeconds: number } | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const raw = localStorage.getItem(`busserz_cache_${key}`);
    if (!raw) return null;

    const envelope = JSON.parse(raw) as ClientCacheEnvelope<T>;
    const now = Date.now();

    if (!envelope || !envelope.expiresAt || now >= envelope.expiresAt) {
      // Expired -> Automatically delete from local cache
      localStorage.removeItem(`busserz_cache_${key}`);
      return null;
    }

    const ttlRemainingSeconds = Math.max(0, Math.ceil((envelope.expiresAt - now) / 1000));
    return {
      data: envelope.data,
      timestamp: envelope.timestamp,
      ttlRemainingSeconds,
    };
  } catch (error) {
    console.warn("Client cache read error:", error);
    return null;
  }
}

export function setClientCache<T>(key: string, data: T, ttlMs: number = DEFAULT_CLIENT_TTL_MS): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    const now = Date.now();
    const envelope: ClientCacheEnvelope<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
    };
    localStorage.setItem(`busserz_cache_${key}`, JSON.stringify(envelope));
  } catch (error) {
    console.warn("Client cache write error:", error);
  }
}

export function removeClientCache(key: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.removeItem(`busserz_cache_${key}`);
  } catch (e) {
    console.warn("Client cache remove error:", e);
  }
}

export function clearAllClientCache(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("busserz_cache_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn("Clear client cache error:", e);
  }
}

export async function fetchWithClientCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_CLIENT_TTL_MS,
  forceRefresh: boolean = false
): Promise<{ data: T; source: "client_cache" | "api"; timestamp: number; ttlRemainingSeconds: number }> {
  if (!forceRefresh) {
    const cached = getClientCache<T>(key);
    if (cached) {
      return {
        data: cached.data,
        source: "client_cache",
        timestamp: cached.timestamp,
        ttlRemainingSeconds: cached.ttlRemainingSeconds,
      };
    }
  }

  // Fetch fresh data
  const freshData = await fetcher();
  setClientCache(key, freshData, ttlMs);
  const now = Date.now();

  return {
    data: freshData,
    source: "api",
    timestamp: now,
    ttlRemainingSeconds: Math.ceil(ttlMs / 1000),
  };
}
