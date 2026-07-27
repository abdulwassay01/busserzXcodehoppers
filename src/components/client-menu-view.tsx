"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { MenuSection } from "@/types/menu";
import { getClientCache, setClientCache, removeClientCache } from "@/lib/client-cache";
import { CacheStatusControl } from "@/components/cache-status";

export function ClientMenuView({ initialMenus }: { initialMenus: MenuSection[] }) {
  const [menus, setMenus] = useState<MenuSection[]>(initialMenus);
  const [source, setSource] = useState<"client_cache" | "static_initial">("static_initial");
  const [updatedAt, setUpdatedAt] = useState<string>("");

  useEffect(() => {
    // 1. Check if we have cached menu data in browser localStorage
    const cached = getClientCache<MenuSection[]>("menus");
    if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
      setMenus(cached.data);
      setSource("client_cache");
      setUpdatedAt(new Date(cached.timestamp).toLocaleTimeString());
      console.log("⚡ [PERSISTENT CACHE HIT] Loaded menu from localStorage. 0 API calls made!");
    } else {
      // 2. If cache is naturally missing/deleted, save initial data to localStorage to use on future reloads
      if (initialMenus && initialMenus.length > 0) {
        setClientCache("menus", initialMenus);
        setSource("static_initial");
        setUpdatedAt(new Date().toLocaleTimeString());
        console.log("💾 [CACHE INITIALIZED] Saved menu data to localStorage.");
      }
    }
  }, [initialMenus]);

  const handleForceRefresh = async () => {
    removeClientCache("menus");
    window.location.reload();
  };

  return (
    <>
      <CacheStatusControl cacheKey="menu" onRefresh={handleForceRefresh} />

      <div className="cache-info-banner">
        <span>
          Data Mode:{" "}
          <strong>
            {source === "client_cache"
              ? "⚡ PERSISTENT BROWSER CACHE (Zero API Calls on Reload)"
              : "💾 CACHED INITIAL DATA"}
          </strong>
        </span>
        {updatedAt ? <span> · Saved at: {updatedAt}</span> : null}
      </div>

      <div className="container-wide menu-grid anim-rise-delay" style={{ marginTop: "1.5rem" }}>
        {menus.map((section) => (
          <section className="panel" key={section.title}>
            {section.imageUrl ? (
              <div className="panel-image">
                <Image
                  src={section.imageUrl}
                  alt={section.title}
                  width={400}
                  height={250}
                  unoptimized
                />
              </div>
            ) : (
              <div className="panel-image no-image">No image available</div>
            )}
            <h2 className="section-title">{section.title}</h2>
            {section.description ? <p className="muted">{section.description}</p> : null}
            <ul className="menu-list">
              {section.items.map((item) => (
                <li className="menu-item" key={item.name}>
                  {item.imageUrl ? (
                    <div className="menu-item-image">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={80}
                        height={60}
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="menu-item-image no-image">No image</div>
                  )}
                  <div className="menu-item-content">
                    <strong>{item.name}</strong>
                    <p className="muted">{item.details}</p>
                  </div>
                  <strong>${item.price.toFixed(2)}</strong>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
