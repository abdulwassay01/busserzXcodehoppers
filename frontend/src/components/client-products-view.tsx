"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { Product } from "@/types/product";
import { getBackendApiBase } from "@/lib/busserz";

type BackendPayload = {
  key?: string;
  data?: {
    data?: Product[];
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

export function ClientProductsView({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        const apiBase = getBackendApiBase();
        let response = await fetch(`${apiBase}/api/data?key=products`, { cache: "no-store" }).catch(() => null);

        if (!response || !response.ok) {
          if (typeof window !== "undefined") {
            const fallbackBase = window.location.origin;
            response = await fetch(`${fallbackBase}/api/data?key=products`, { cache: "no-store" }).catch(() => null);
          }
        }

        if (response && response.ok) {
          const payload = (await response.json()) as BackendPayload;
          const storedData = payload?.data;
          if (active && Array.isArray(storedData?.data) && storedData.data.length > 0) {
            setProducts(storedData.data);
            return;
          }
        }
      } catch (error) {
        console.warn("Failed to load backend products payload:", error);
      }

      if (active && initialProducts?.length) {
        setProducts(initialProducts);
      }
    };

    loadProducts();
    return () => {
      active = false;
    };
  }, [initialProducts]);

  return (
    <div className="products-grid anim-rise-delay" style={{ marginTop: "1.5rem" }}>
      {products.map((product, idx) => {
        const pName = safeString(product.name, "Product");
        const pDesc = safeString(product.description, "No description available.");
        const pCat = safeString(product.category, "General");
        const pPrice = typeof product.price === "number" && Number.isFinite(product.price) ? product.price : Number(product.price ?? 0);

        return (
          <article key={product.id || idx} className="product-card">
            {product.imageUrl ? (
              <div className="product-image">
                <Image
                  src={product.imageUrl}
                  alt={pName}
                  width={300}
                  height={200}
                  unoptimized
                />
              </div>
            ) : (
              <div className="product-image no-image">No image available</div>
            )}
            <span className="badge">{pCat}</span>
            <h2 className="section-title">{pName}</h2>
            <p className="muted">{pDesc}</p>
            <div className="price-tag">
              ${(Number.isFinite(pPrice) ? pPrice : 0).toFixed(2)}
              {product.featured ? <span style={{ fontSize: "0.8rem", color: "#34d399", marginLeft: "0.5rem" }}>· Chef Pick</span> : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
