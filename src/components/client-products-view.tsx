"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { Product } from "@/types/product";
import { getClientCache, setClientCache, removeClientCache } from "@/lib/client-cache";
import { CacheStatusControl } from "@/components/cache-status";

export function ClientProductsView({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [source, setSource] = useState<"client_cache" | "static_initial">("static_initial");
  const [updatedAt, setUpdatedAt] = useState<string>("");

  useEffect(() => {
    // 1. Check if we have cached products data in browser localStorage
    const cached = getClientCache<Product[]>("products");
    if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
      setProducts(cached.data);
      setSource("client_cache");
      setUpdatedAt(new Date(cached.timestamp).toLocaleTimeString());
      console.log("⚡ [PERSISTENT CACHE HIT] Loaded products from localStorage. 0 API calls made!");
    } else {
      // 2. If cache is naturally missing/deleted, save initial data to localStorage to use on future reloads
      if (initialProducts && initialProducts.length > 0) {
        setClientCache("products", initialProducts);
        setSource("static_initial");
        setUpdatedAt(new Date().toLocaleTimeString());
        console.log("💾 [CACHE INITIALIZED] Saved products data to localStorage.");
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
              ? "⚡ PERSISTENT BROWSER CACHE (Zero API Calls on Reload)"
              : "💾 CACHED INITIAL DATA"}
          </strong>
        </span>
        {updatedAt ? <span> · Saved at: {updatedAt}</span> : null}
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
