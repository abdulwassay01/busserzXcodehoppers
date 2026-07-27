"use client";

import { useState, useEffect, useCallback } from "react";
import { getClientCache, clearAllClientCache, removeClientCache } from "@/lib/client-cache";

interface LocalCacheInfo {
  products: { timestamp: number; count: number } | null;
  menu: { timestamp: number; count: number } | null;
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
            count: Array.isArray(productsCached.data) ? productsCached.data.length : 0,
          }
        : null,
      menu: menuCached
        ? {
            timestamp: menuCached.timestamp,
            count: Array.isArray(menuCached.data) ? menuCached.data.length : 0,
          }
        : null,
    });
  }, []);

  useEffect(() => {
    checkCache();
  }, [checkCache]);

  const activeKeyInfo = cacheKey === "menu" ? cacheInfo.menu : cacheInfo.products;
  const isCached = !!activeKeyInfo;

  const handleClearCache = () => {
    if (cacheKey === "products") {
      removeClientCache("products");
    } else if (cacheKey === "menu") {
      removeClientCache("menus");
    } else {
      clearAllClientCache();
    }
    checkCache();
    setMessage("🗑️ Cache deleted! Reloading & calling API...");
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
    setMessage("🧹 All browser caches deleted!");
    setTimeout(() => {
      setMessage(null);
      window.location.reload();
    }, 800);
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
                Serving <strong>{activeKeyInfo.count}</strong> cached items from browser storage. (<strong>0 API calls on reload</strong>)
              </>
            ) : (
              "No local cache found. Calling API and storing data for future reloads."
            )}
          </span>
        </div>

        <div className="cache-bar-actions">
          <button
            type="button"
            className="cache-btn cache-btn-ghost"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Hide Stats ▲" : "Cache Info ▼"}
          </button>
          <button
            type="button"
            className="cache-btn cache-btn-primary"
            onClick={handleClearCache}
          >
            🔄 Delete Cache & Re-fetch
          </button>
        </div>
      </div>

      {message ? <div className="cache-toast">{message}</div> : null}

      {isExpanded ? (
        <div className="cache-details-panel">
          <div className="cache-stats-grid">
            <div className="stat-card">
              <span className="stat-value">{cacheInfo.products ? "Active" : "Deleted"}</span>
              <span className="stat-label">Products Cache</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{cacheInfo.menu ? "Active" : "Deleted"}</span>
              <span className="stat-label">Menu Cache</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">Persistent</span>
              <span className="stat-label">Auto-Expire Policy</span>
            </div>
          </div>

          <div className="cache-keys-table">
            <h4>Cache Storage Overview</h4>
            <ul>
              <li>
                <span className="key-name">📦 Products Cache</span>
                {cacheInfo.products ? (
                  <span className="key-ttl">
                    Cached ({cacheInfo.products.count} items) · Saved at{" "}
                    <strong>{new Date(cacheInfo.products.timestamp).toLocaleTimeString()}</strong>
                  </span>
                ) : (
                  <span className="muted">No cached data (Will fetch API)</span>
                )}
              </li>
              <li>
                <span className="key-name">🍽️ Menus Cache</span>
                {cacheInfo.menu ? (
                  <span className="key-ttl">
                    Cached ({cacheInfo.menu.count} items) · Saved at{" "}
                    <strong>{new Date(cacheInfo.menu.timestamp).toLocaleTimeString()}</strong>
                  </span>
                ) : (
                  <span className="muted">No cached data (Will fetch API)</span>
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
              🧹 Delete All Browser Caches
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
