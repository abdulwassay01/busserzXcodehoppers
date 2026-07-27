"use client";

import { useState, useEffect, useCallback } from "react";
import { getClientCache, clearAllClientCache, removeClientCache } from "@/lib/client-cache";

interface LocalCacheInfo {
  products: { timestamp: number; ttlRemainingSeconds: number; count: number } | null;
  menu: { timestamp: number; ttlRemainingSeconds: number; count: number } | null;
}

export function CacheStatusControl({
  cacheKey,
  onRefresh,
}: {
  cacheKey?: "products" | "menu";
  onRefresh?: () => void;
}) {
  const [cacheInfo, setCacheInfo] = useState<LocalCacheInfo>({ products: null, menu: null });
  const [message, setMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const checkCache = useCallback(() => {
    const productsCached = getClientCache<unknown[]>("products");
    const menuCached = getClientCache<unknown[]>("menus");

    setCacheInfo({
      products: productsCached
        ? {
            timestamp: productsCached.timestamp,
            ttlRemainingSeconds: productsCached.ttlRemainingSeconds,
            count: Array.isArray(productsCached.data) ? productsCached.data.length : 0,
          }
        : null,
      menu: menuCached
        ? {
            timestamp: menuCached.timestamp,
            ttlRemainingSeconds: menuCached.ttlRemainingSeconds,
            count: Array.isArray(menuCached.data) ? menuCached.data.length : 0,
          }
        : null,
    });
  }, []);

  useEffect(() => {
    checkCache();
    const interval = setInterval(checkCache, 1000);
    return () => clearInterval(interval);
  }, [checkCache]);

  const activeKeyInfo = cacheKey === "menu" ? cacheInfo.menu : cacheInfo.products;
  const isCached = !!activeKeyInfo && activeKeyInfo.ttlRemainingSeconds > 0;

  const handleClearCache = () => {
    if (cacheKey === "products") {
      removeClientCache("products");
    } else if (cacheKey === "menu") {
      removeClientCache("menus");
    } else {
      clearAllClientCache();
    }
    checkCache();
    setMessage("🗑️ Cache cleared! Reloading fresh data...");
    setTimeout(() => {
      setMessage(null);
      if (onRefresh) {
        onRefresh();
      } else {
        window.location.reload();
      }
    }, 800);
  };

  const handleClearAll = () => {
    clearAllClientCache();
    checkCache();
    setMessage("🧹 All cached data cleared!");
    setTimeout(() => {
      setMessage(null);
      window.location.reload();
    }, 800);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="cache-bar-wrapper">
      <div className="cache-bar">
        <div className="cache-bar-info">
          <span className={`cache-pill ${isCached ? "cache-pill-active" : "cache-pill-api"}`}>
            {isCached ? "⚡ BROWSER CACHE ACTIVE" : "🌐 API FETCH MODE"}
          </span>
          <span className="cache-text">
            {isCached ? (
              <>
                Serving <strong>{activeKeyInfo.count}</strong> cached items · Auto-deletes in{" "}
                <strong>{formatSeconds(activeKeyInfo.ttlRemainingSeconds)}</strong>
              </>
            ) : (
              "No active local cache. Next load will call Busserz API & cache the result."
            )}
          </span>
        </div>

        <div className="cache-bar-actions">
          <button
            type="button"
            className="cache-btn cache-btn-ghost"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Hide Stats ▲" : "Cache Stats ▼"}
          </button>
          <button
            type="button"
            className="cache-btn cache-btn-primary"
            onClick={handleClearCache}
          >
            🔄 Force Re-fetch
          </button>
        </div>
      </div>

      {message ? <div className="cache-toast">{message}</div> : null}

      {isExpanded ? (
        <div className="cache-details-panel">
          <div className="cache-stats-grid">
            <div className="stat-card">
              <span className="stat-value">{cacheInfo.products ? "Active" : "Empty"}</span>
              <span className="stat-label">Products Cache</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{cacheInfo.menu ? "Active" : "Empty"}</span>
              <span className="stat-label">Menu Cache</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">5 min</span>
              <span className="stat-label">Auto-Expire TTL</span>
            </div>
          </div>

          <div className="cache-keys-table">
            <h4>Cache Status Overview</h4>
            <ul>
              <li>
                <span className="key-name">📦 Products Cache</span>
                {cacheInfo.products ? (
                  <span className="key-ttl">
                    Cached ({cacheInfo.products.count} items) · Expires in{" "}
                    <strong>{formatSeconds(cacheInfo.products.ttlRemainingSeconds)}</strong>
                  </span>
                ) : (
                  <span className="muted">No cached data</span>
                )}
              </li>
              <li>
                <span className="key-name">🍽️ Menus Cache</span>
                {cacheInfo.menu ? (
                  <span className="key-ttl">
                    Cached ({cacheInfo.menu.count} items) · Expires in{" "}
                    <strong>{formatSeconds(cacheInfo.menu.ttlRemainingSeconds)}</strong>
                  </span>
                ) : (
                  <span className="muted">No cached data</span>
                )}
              </li>
            </ul>
          </div>

          <div className="cache-panel-actions">
            <button
              type="button"
              className="cache-btn cache-btn-danger"
              onClick={handleClearAll}
            >
              🧹 Clear All Browser Caches
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
