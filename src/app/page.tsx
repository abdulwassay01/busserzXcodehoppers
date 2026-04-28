import Link from "next/link";

export default function Home() {
  return (
    <div>
      <section className="hero-shell">
        <div className="container-wide hero-grid">
          <div>
            <p className="eyebrow">Kitchen Stories Since 2016</p>
            <h1 className="hero-title">busserzXcodehoppers</h1>
            <p className="hero-subtitle">
              Honest ingredients, wood-fired signatures, and a bold modern table
              experience crafted for everyday celebrations.
            </p>
            <div className="hero-cta-row">
              <Link className="btn-primary" href="/menu">
                Explore Menu
              </Link>
              <Link className="btn-ghost" href="/products">
                Browse Products
              </Link>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="platter-card">
              <p className="platter-name">Flame Bowl Signature</p>
              <p className="platter-meta">Smoked tomato, herbed rice, citrus finish</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-wide cards-grid">
          <article className="feature-card">
            <h2>Seasonal Menus</h2>
            <p>
              Rotating starters, handcrafted mains, and dessert flights tuned to
              local produce and comfort-forward flavors.
            </p>
          </article>
          <article className="feature-card">
            <h2>Craft Pantry</h2>
            <p>
              Sauces, spice blends, and table essentials available as products you
              can order and integrate later from your workspace data source.
            </p>
          </article>
          <article className="feature-card">
            <h2>Private Dining</h2>
            <p>
              Designed spaces for teams, families, and celebrations with custom
              course planning and service experiences.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
