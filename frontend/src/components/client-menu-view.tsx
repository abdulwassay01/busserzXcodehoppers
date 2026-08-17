"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { MenuSection } from "@/types/menu";
import { normalizeMenuSection, getBackendApiBase, type RawEntity } from "@/lib/busserz";

type BackendPayload = {
  key?: string;
  data?: {
    data?: RawEntity[];
    savedAt?: string;
    apiKey?: string;
    spaceId?: string;
  } | null;
};

function safeString(value: unknown, fallback: string = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.en === "string" && record.en.trim() !== "") return record.en;
    for (const val of Object.values(record)) {
      if (typeof val === "string" && val.trim() !== "") return val;
      if (val && typeof val === "object") {
        const nested = safeString(val, "");
        if (nested) return nested;
      }
    }
  }
  return fallback;
}

function processMenuData(dataList: unknown[]): MenuSection[] {
  return dataList
    .filter((item): item is RawEntity => !!item && typeof item === "object")
    .map((item) => {
      if (typeof item.title === "string" && Array.isArray(item.items)) {
        return item as unknown as MenuSection;
      }
      return normalizeMenuSection(item);
    });
}

export function ClientMenuView({ initialMenus }: { initialMenus: MenuSection[] }) {
  const [menus, setMenus] = useState<MenuSection[]>(() => processMenuData(initialMenus ?? []));

  useEffect(() => {
    if (Array.isArray(initialMenus) && initialMenus.length > 0) {
      setMenus(processMenuData(initialMenus));
    }
  }, [initialMenus]);

  useEffect(() => {
    let active = true;

    const loadMenus = async () => {
      try {
        const candidates: string[] = [];
        if (typeof window !== "undefined") {
          const { hostname, protocol, origin } = window.location;
          const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
          const envBase = process.env.NEXT_PUBLIC_BACKEND_API_BASE;
          if (envBase && envBase.trim() !== "" && (!envBase.includes("localhost") || isLocal)) {
            candidates.push(envBase);
          }
          if (!isLocal) {
            candidates.push(`${origin}/busserz/api/data`);
            candidates.push(`${origin}/api/data`);
            candidates.push(`${protocol}//${hostname}:4000`);
          } else {
            candidates.push(`http://localhost:4000`);
          }
        }

        for (const baseUrl of candidates) {
          try {
            const fetchUrl = baseUrl.includes("?") ? baseUrl : `${baseUrl}?key=menus`;
            const res = await fetch(fetchUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key: "menus", action: "get" }),
              cache: "no-store",
            }).catch(() => null);

            if (res && res.ok) {
              const cType = res.headers.get("content-type") || "";
              if (cType.includes("application/json")) {
                const payload = (await res.json().catch(() => null)) as BackendPayload | null;
                const storedData = payload?.data;
                if (active && Array.isArray(storedData?.data) && storedData.data.length > 0) {
                  setMenus(processMenuData(storedData.data));
                  return;
                }
              }
            }
          } catch {
            // try next candidate endpoint
          }
        }
      } catch (error) {
        console.warn("Failed to load backend menu payload:", error);
      }

      if (active && initialMenus?.length) {
        setMenus(processMenuData(initialMenus));
      }
    };

    loadMenus();
    return () => {
      active = false;
    };
  }, [initialMenus]);

  return (
    <div className="menu-grid anim-rise-delay" style={{ marginTop: "1.5rem" }}>
      {menus.map((section, sIdx) => {
        const sTitle = safeString(section.title, "Menu Category");
        const sDesc = safeString(section.description, "");
        const items = Array.isArray(section.items) ? section.items : [];

        return (
          <section className="panel" key={section.id || sIdx}>
            {section.imageUrl ? (
              <div className="panel-image">
                <Image
                  src={section.imageUrl}
                  alt={sTitle}
                  width={400}
                  height={250}
                  unoptimized
                />
              </div>
            ) : (
              <div className="panel-image no-image">No image available</div>
            )}
            <h2 className="section-title">{sTitle}</h2>
            {sDesc ? <p className="muted">{sDesc}</p> : null}
            <ul className="menu-list">
              {items.map((item, iIdx) => {
                const iName = safeString(item.name, "Item");
                const iDetails = safeString(item.details, "");
                const iPrice = typeof item.price === "number" && Number.isFinite(item.price) ? item.price : Number(item.price ?? 0);

                return (
                  <li className="menu-item" key={item.id || iIdx}>
                    {item.imageUrl ? (
                      <div className="menu-item-image">
                        <Image
                          src={item.imageUrl}
                          alt={iName}
                          width={80}
                          height={60}
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="menu-item-image no-image">No image</div>
                    )}
                    <div className="menu-item-content">
                      <strong>{iName}</strong>
                      {iDetails ? <p className="muted">{iDetails}</p> : null}
                    </div>
                    <span className="menu-item-price">${(Number.isFinite(iPrice) ? iPrice : 0).toFixed(2)}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
