import Image from "next/image";
import { getBusserzProductsWithMeta } from "@/lib/busserz";
import { CacheStatusControl } from "@/components/cache-status";

export default async function ProductsPage() {
  const { data: products, source, timestamp, ttlRemainingSeconds } = await getBusserzProductsWithMeta();

  const formattedTime = new Date(timestamp).toLocaleTimeString();

  return (
    <div className="page-shell">
      <div className="container-wide anim-rise">
        <h1 className="page-title">Products</h1>
        <p className="page-subtitle">
          Live product data from your Busserz space, served via our auto-expiring cache layer.
        </p>

        <CacheStatusControl cacheKey="products" />

        <div className="cache-info-banner">
          <span>
            Server Cache Status: <strong>{source === "cache" ? "⚡ CACHE (No API Call Made)" : "🌐 FRESH BUSSERZ API"}</strong>
          </span>
          <span> · Updated at: {formattedTime}</span>
          {source === "cache" ? (
            <span> · Auto-deletes in <strong>{ttlRemainingSeconds}s</strong></span>
          ) : null}
        </div>
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
    </div>
  );
}