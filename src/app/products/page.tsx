import { getProducts } from "@/lib/products";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="page-shell">
      <div className="container-wide anim-rise">
        <h1 className="page-title">Products</h1>
        <p className="page-subtitle">
          Live product data from your Busserz space, rendered through the shared
          async data layer.
        </p>
      </div>

      <div className="container-wide products-grid anim-rise-delay">
        {products.map((product) => (
          <article key={product.id} className="product-card">
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