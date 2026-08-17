"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { Product } from "@/types/product";
import { normalizeProduct, getBackendApiBase, type RawEntity } from "@/lib/busserz";

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

function processProductData(dataList: unknown[]): Product[] {
  return dataList
    .filter((item): item is RawEntity => !!item && typeof item === "object")
    .map((item) => {
      if (typeof item.name === "string" && typeof item.category === "string") {
        return item as unknown as Product;
      }
      return normalizeProduct(item);
    });
}

export function ClientProductsView({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(() => processProductData(initialProducts ?? []));

  useEffect(() => {
    if (Array.isArray(initialProducts) && initialProducts.length > 0) {
      setProducts(processProductData(initialProducts));
    }
  }, [initialProducts]);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
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
            candidates.push(`${origin}/api/data`);
            candidates.push(`${origin}/busserz/api/data`);
            candidates.push(`${protocol}//${hostname}:4000`);
          } else {
            candidates.push(`http://localhost:4000`);
          }
        } else {
          candidates.push(getBackendApiBase());
        }

        for (const baseUrl of candidates) {
          try {
            const fetchUrl = baseUrl.includes("?") ? baseUrl : `${baseUrl}?key=products`;
            const res = await fetch(fetchUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key: "products", action: "get" }),
              cache: "no-store",
            }).catch(() => null);

            if (res && res.ok) {
              const cType = res.headers.get("content-type") || "";
              if (cType.includes("application/json")) {
                const payload = (await res.json().catch(() => null)) as BackendPayload | null;
                const storedData = payload?.data;
                if (active && Array.isArray(storedData?.data) && storedData.data.length > 0) {
                  setProducts(processProductData(storedData.data));
                  return;
                }
              }
            }
          } catch {
            // try next candidate
          }
        }
      } catch (error) {
        console.warn("Failed to load backend products payload:", error);
      }
      if (active && initialProducts?.length) {
        setProducts(processProductData(initialProducts));
      }
    };

    loadProducts();
    return () => {
      active = false;
    };
  }, [initialProducts]);

  return (
    <div className="cards-grid anim-rise-delay" style={{ marginTop: "1.5rem" }}>
      {products.map((product, pIdx) => {
        const pName = safeString(product.name, "Product");
        const pDesc = safeString(product.description, "No description available.");
        const pCat = safeString(product.category, "General");
        const pPrice = typeof product.price === "number" && Number.isFinite(product.price) ? product.price : Number(product.price ?? 0);

        return (
          <article className="product-card" key={product.id || pIdx}>
            {product.imageUrl ? (
              <div className="product-image">
                <Image
                  src={product.imageUrl}
                  alt={pName}
                  width={400}
                  height={250}
                  unoptimized
                />
              </div>
            ) : (
              <div className="product-image no-image">No image available</div>
            )}
            <span className="badge">{pCat}</span>
            <h2 className="section-title">{pName}</h2>
            <p className="muted" style={{ flexGrow: 1 }}>{pDesc}</p>
            <div className="price-tag">${(Number.isFinite(pPrice) ? pPrice : 0).toFixed(2)}</div>
          </article>
        );
      })}
    </div>
  );
}
