import { getBusserzProducts } from "@/lib/busserz";
import { ClientProductsView } from "@/components/client-products-view";

export default async function ProductsPage() {
  const initialProducts = await getBusserzProducts();

  return (
    <div className="page-shell">
      <div className="container-wide anim-rise">
        <h1 className="page-title">Products</h1>
        <p className="page-subtitle">
          Live product data from your Busserz space, cached locally to minimize API cost.
        </p>

        <ClientProductsView initialProducts={initialProducts} />
      </div>
    </div>
  );
}