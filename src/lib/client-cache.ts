"use client";

export interface ClientCacheEnvelope<T> {
  data: T;
  timestamp: number;
}

export function getClientCache<T>(key: string): { data: T; timestamp: number } | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const raw = localStorage.getItem(`busserz_cache_${key}`);
    if (!raw) return null;

    const envelope = JSON.parse(raw) as ClientCacheEnvelope<T>;
    if (!envelope || !envelope.data) {
      return null;
    }

    return {
      data: envelope.data,
      timestamp: envelope.timestamp ?? Date.now(),
    };
  } catch (error) {
    console.warn("Client cache read error:", error);
    return null;
  }
}

export function setClientCache<T>(key: string, data: T): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    const envelope: ClientCacheEnvelope<T> = {
      data,
      timestamp: Date.now(),
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
