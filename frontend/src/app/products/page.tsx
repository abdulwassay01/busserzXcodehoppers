import { getBusserzProducts } from "@/lib/busserz";
import { ClientProductsView } from "@/components/client-products-view";
import { CacheStatusControl } from "@/components/cache-status";

export default async function ProductsPage() {
  const initialProducts = await getBusserzProducts();

  return (
    <div className="page-shell">
      <div className="container-wide anim-rise">
        <h1 className="page-title">Products</h1>
        <p className="page-subtitle">
          Live product data from your Busserz workspace. Stored in backend JSON, served locally, and auto-invalidated whenever the space ID or token updates.
        </p>

        <CacheStatusControl cacheKey="products" />

        <ClientProductsView initialProducts={initialProducts} />
      </div>
    </div>
  );
}