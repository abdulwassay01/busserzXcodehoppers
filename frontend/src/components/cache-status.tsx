"use client";

import { useState, useEffect, useCallback } from "react";

interface BackendCacheInfo {
  timestamp: number;
  count: number;
}

interface BackendCacheState {
  products: BackendCacheInfo | null;
  menu: BackendCacheInfo | null;
}

import { getBackendApiBase } from "@/lib/busserz";

export function CacheStatusControl({
  cacheKey,
  onRefresh,
}: {
  cacheKey?: "products" | "menu";
  onRefresh?: () => void;
}) {
  const [cacheInfo, setCacheInfo] = useState<BackendCacheState>({ products: null, menu: null });
  const [message, setMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const checkCache = useCallback(async () => {
    const apiBase = getBackendApiBase();
    try {
      const [productsResponse, menuResponse] = await Promise.all([
        fetch(`${apiBase}?key=products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "products", action: "get" }),
          cache: "no-store",
        }),
        fetch(`${apiBase}?key=menus`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "menus", action: "get" }),
          cache: "no-store",
        }),
      ]);

      const productsPayload = productsResponse.ok ? await productsResponse.json() : null;
      const menuPayload = menuResponse.ok ? await menuResponse.json() : null;

      setCacheInfo({
        products: productsPayload?.data?.data?.length
          ? {
            timestamp: Date.parse(productsPayload.data.savedAt ?? "") || Date.now(),
            count: productsPayload.data.data.length,
          }
          : null,
        menu: menuPayload?.data?.data?.length
          ? {
            timestamp: Date.parse(menuPayload.data.savedAt ?? "") || Date.now(),
            count: menuPayload.data.data.length,
          }
          : null,
      });
    } catch {
      setCacheInfo({ products: null, menu: null });
    }
  }, []);

  useEffect(() => {
    checkCache();
  }, [checkCache]);

  const activeKeyInfo = cacheKey === "menu" ? cacheInfo.menu : cacheInfo.products;
  const isCached = !!activeKeyInfo;

  const handleClearCache = async () => {
    const apiBase = getBackendApiBase();
    if (cacheKey === "products") {
      await fetch(`${apiBase}?key=products`, { method: "DELETE" });
    } else if (cacheKey === "menu") {
      await fetch(`${apiBase}?key=menus`, { method: "DELETE" });
    } else {
      await Promise.all([
        fetch(`${apiBase}?key=products`, { method: "DELETE" }),
        fetch(`${apiBase}?key=menus`, { method: "DELETE" }),
      ]);
    }

    await checkCache();
    setMessage("🗑️ Backend JSON deleted! Reloading and re-fetching fresh data...");
    setTimeout(() => {
      setMessage(null);
      if (onRefresh) {
        onRefresh();
      } else {
        window.location.reload();
      }
    }, 800);
  };

  const handleClearAll = async () => {
    const apiBase = getBackendApiBase();
    await Promise.all([
      fetch(`${apiBase}?key=products`, { method: "DELETE" }),
      fetch(`${apiBase}?key=menus`, { method: "DELETE" }),
    ]);
    await checkCache();
    setMessage("🧹 All backend JSON data deleted!");
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
            {isCached ? "🔗 BACKEND JSON ACTIVE" : "🌐 FETCHING FROM SOURCE"}
          </span>
          <span className="cache-text">
            {isCached ? (
              <>
                Serving <strong>{activeKeyInfo.count}</strong> items from backend JSON storage.
              </>
            ) : (
              "No persisted JSON found. The app will fetch fresh data and store it for later."
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
            🔄 Delete JSON & Re-fetch
          </button>
        </div>
      </div>

      {message ? <div className="cache-toast">{message}</div> : null}

      {isExpanded ? (
        <div className="cache-details-panel">
          <div className="cache-stats-grid">
            <div className="stat-card">
              <span className="stat-value">{cacheInfo.products ? "Active" : "Deleted"}</span>
              <span className="stat-label">Products JSON</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{cacheInfo.menu ? "Active" : "Deleted"}</span>
              <span className="stat-label">Menu JSON</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">Persistent</span>
              <span className="stat-label">Backend Storage</span>
            </div>
          </div>

          <div className="cache-keys-table">
            <h4>Backend Storage Overview</h4>
            <ul>
              <li>
                <span className="key-name">📦 Products JSON</span>
                {cacheInfo.products ? (
                  <span className="key-ttl">
                    Stored ({cacheInfo.products.count} items) · Saved at{" "}
                    <strong>{new Date(cacheInfo.products.timestamp).toLocaleTimeString()}</strong>
                  </span>
                ) : (
                  <span className="muted">No persisted data yet</span>
                )}
              </li>
              <li>
                <span className="key-name">🍽️ Menus JSON</span>
                {cacheInfo.menu ? (
                  <span className="key-ttl">
                    Stored ({cacheInfo.menu.count} items) · Saved at{" "}
                    <strong>{new Date(cacheInfo.menu.timestamp).toLocaleTimeString()}</strong>
                  </span>
                ) : (
                  <span className="muted">No persisted data yet</span>
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
              🧹 Delete All Backend JSON
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
