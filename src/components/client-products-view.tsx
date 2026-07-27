"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { Product } from "@/types/product";
import { getClientCache, setClientCache, removeClientCache } from "@/lib/client-cache";
import { CacheStatusControl } from "@/components/cache-status";

const CLIENT_TTL_MS = 60 * 60 * 1000; // 1 hour client cache TTL (saves API costs)

export function ClientProductsView({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [source, setSource] = useState<"client_cache" | "static_initial">("static_initial");
  const [updatedAt, setUpdatedAt] = useState<string>("");

  useEffect(() => {
    // 1. Check if we have valid non-expired cached products data in localStorage
    const cached = getClientCache<Product[]>("products");
    if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
      setProducts(cached.data);
      setSource("client_cache");
      setUpdatedAt(new Date(cached.timestamp).toLocaleTimeString());
      console.log("⚡ [CLIENT CACHE HIT] Loaded products from localStorage. 0 API hits made!");
    } else {
      // 2. If no client cache exists, save initial static build payload to localStorage to prevent future API calls on reload
      if (initialProducts && initialProducts.length > 0) {
        setClientCache("products", initialProducts, CLIENT_TTL_MS);
        setSource("static_initial");
        setUpdatedAt(new Date().toLocaleTimeString());
        console.log("💾 [CLIENT CACHE STORED] Saved initial products data to localStorage.");
      }
    }
  }, [initialProducts]);

  const handleForceRefresh = async () => {
    removeClientCache("products");
    window.location.reload();
  };

  return (
    <>
      <CacheStatusControl cacheKey="products" onRefresh={handleForceRefresh} />

      <div className="cache-info-banner">
        <span>
          Data Mode:{" "}
          <strong>
            {source === "client_cache"
              ? "⚡ PERSISTENT LOCALSTORAGE CACHE (Zero API Calls on Reload)"
              : "💾 CACHED INITIAL DATA"}
          </strong>
        </span>
        {updatedAt ? <span> · Cached at: {updatedAt}</span> : null}
      </div>

      <div className="container-wide products-grid anim-rise-delay" style={{ marginTop: "1.5rem" }}>
        {products.map((product) => (
          <article key={product.id} className="product-card">
            {product.imageUrl ? (
              <div className="product-image">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={300}
                  height={200}
                  unoptimized
                />
              </div>
            ) : (
              <div className="product-image no-image">No image</div>
            )}
            <span className="badge">{product.category}</span>
            <h2 className="section-title">{product.name}</h2>
            <p className="muted">{product.description}</p>
            <p>
              <strong>${product.price.toFixed(2)}</strong>
              {product.featured ? " · Chef Pick" : ""}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
