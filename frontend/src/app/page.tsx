import Link from "next/link";
import Image from "next/image";
import { getBusserzMenus, getBusserzProducts, safeString } from "@/lib/busserz";
import { CacheStatusControl } from "@/components/cache-status";

export default async function Home() {
  const [menus, products] = await Promise.all([
    getBusserzMenus().catch(() => []),
    getBusserzProducts().catch(() => []),
  ]);

  const featuredMenuSection = menus[0] ?? null;
  const featuredProducts = products.slice(0, 3);

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section className="hero-shell">
        <div className="container-wide hero-grid">
          <div className="anim-rise">
            <div className="eyebrow-badge">
              <span className="pulse-dot" />
              Open Today · 11:00 AM - 11:00 PM
            </div>
            <h1 className="hero-title">busserzXcodehoppers</h1>
            <p className="hero-subtitle">
              Honest artisan ingredients, wood-fired signatures, and a bold modern table
              experience crafted for everyday celebrations.
            </p>
            <div className="hero-cta-row">
              <Link className="btn-primary" href="/menu">
                Explore Menus
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link className="btn-ghost" href="/products">
                Browse Pantry Products
              </Link>
              <Link className="btn-ghost" href="/contact" style={{ borderColor: "rgba(245,158,11,0.3)" }}>
                Book a Table
              </Link>
            </div>
          </div>

          <div className="hero-art-wrapper anim-rise-delay">
            <div className="hero-art-card">
              <div className="hero-image-container">
                <Image
                  src="/busserz/hero_signature_dish.png"
                  alt="Flame Bowl Signature Dish"
                  width={600}
                  height={400}
                  priority
                  unoptimized
                />
                <div className="rating-floating-pill">
                  <span>★ 4.9</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>(1.2k+ Reviews)</span>
                </div>
              </div>
              <div className="hero-art-content">
                <span className="platter-badge">✨ Chef Specialty</span>
                <h3 className="platter-name">Flame Bowl Signature</h3>
                <p className="platter-meta">
                  Smoked artisan tomato, roasted garden vegetables, herbed jasmine rice & citrus finish.
                </p>
                <div className="hero-art-footer">
                  <span className="hero-art-price">$14.90</span>
                  <Link href="/menu" className="btn-primary" style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>
                    Order Dish
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS STRIP */}
      <section className="container-wide anim-rise">
        <div className="stats-strip">
          <div className="stat-item">
            <span className="stat-number">100%</span>
            <span className="stat-desc">Fresh Daily Produce</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">4.9 ★</span>
            <span className="stat-desc">Guest Rating (1,200+ Reviews)</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">&lt; 20m</span>
            <span className="stat-desc">Average Kitchen Prep Time</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">15+</span>
            <span className="stat-desc">Handcrafted Pantry Products</span>
          </div>
        </div>
      </section>

      {/* 3. FEATURED MENU PREVIEW */}
      {featuredMenuSection && (
        <section className="section-pad">
          <div className="container-wide">
            <div className="section-header anim-rise">
              <span className="badge">Featured Menu</span>
              <h2>{safeString(featuredMenuSection.title, "Chef Specials")}</h2>
              <p>{safeString(featuredMenuSection.description, "Explore our handpicked signature section available for dining in and takeout.")}</p>
            </div>

            <div className="menu-grid anim-rise-delay">
              <div className="panel" style={{ gridColumn: "1 / -1" }}>
                <ul className="menu-list">
                  {(featuredMenuSection.items ?? []).slice(0, 4).map((item, idx) => (
                    <li key={item.id || idx} className="menu-item">
                      {item.imageUrl ? (
                        <div className="menu-item-image">
                          <Image src={item.imageUrl} alt={safeString(item.name)} width={80} height={64} unoptimized />
                        </div>
                      ) : (
                        <div className="menu-item-image no-image">Dish</div>
                      )}
                      <div className="menu-item-content">
                        <strong>{safeString(item.name, "Dish")}</strong>
                        <p className="muted" style={{ margin: "0.2rem 0 0 0", fontSize: "0.88rem" }}>
                          {safeString(item.details, "Chef recommended signature dish")}
                        </p>
                      </div>
                      <span className="menu-item-price">${(typeof item.price === "number" ? item.price : 0).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>

                <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                  <Link href="/menu" className="btn-ghost">
                    View Full Menu Section ({featuredMenuSection.items?.length ?? 0} items) →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. FEATURED PANTRY PRODUCTS */}
      {featuredProducts.length > 0 && (
        <section className="section-pad" style={{ paddingTop: 0 }}>
          <div className="container-wide">
            <div className="section-header anim-rise">
              <span className="badge">Workspace Pantry</span>
              <h2>Popular Products</h2>
              <p>Handcrafted sauces, seasonings, and pantry items served directly from your live Busserz data backend.</p>
            </div>

            <div className="cards-grid anim-rise-delay">
              {featuredProducts.map((product, idx) => (
                <article key={product.id || idx} className="product-card">
                  {product.imageUrl ? (
                    <div className="product-image">
                      <Image src={product.imageUrl} alt={safeString(product.name)} width={300} height={200} unoptimized />
                    </div>
                  ) : (
                    <div className="product-image no-image">Product</div>
                  )}
                  <span className="badge">{safeString(product.category, "General")}</span>
                  <h2 className="section-title">{safeString(product.name, "Product")}</h2>
                  <p className="muted" style={{ flexGrow: 1 }}>{safeString(product.description, "No description available.")}</p>
                  <div className="price-tag">${(typeof product.price === "number" ? product.price : 0).toFixed(2)}</div>
                </article>
              ))}
            </div>

            <div style={{ marginTop: "2rem", textAlign: "center", display: "flex", justifyContent: "center" }}>
              <Link href="/products" className="btn-primary">
                Browse All Workspace Products →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 5. CULINARY CRAFT & PHILOSOPHY */}
      <section className="section-pad">
        <div className="container-wide">
          <div className="story-box anim-rise">
            <div className="story-grid">
              <div>
                <span className="badge">Our Heritage</span>
                <h2 className="story-title">Crafted with Fire, Precision & Passion</h2>
                <p className="story-text">
                  We believe great food starts with authentic preparation. Our wood-fired ovens operate at over 800°F, sealing in moisture and natural juices while adding a signature smoky aroma to every course.
                </p>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <Link href="/about" className="btn-ghost">
                    Our Story →
                  </Link>
                </div>
              </div>

              <div className="story-pills">
                <div className="story-pill-item">
                  <span className="story-pill-icon">🪵</span>
                  <div>
                    <h4 className="story-pill-icon-title story-pill-title">Oak Ember Roasting</h4>
                    <p className="story-pill-desc">Sourced local oak timber brings genuine depth to every plate.</p>
                  </div>
                </div>

                <div className="story-pill-item">
                  <span className="story-pill-icon">🌿</span>
                  <div>
                    <h4 className="story-pill-title">Zero Preservatives</h4>
                    <p className="story-pill-desc">Small-batch kitchen preparation every morning at 6:00 AM.</p>
                  </div>
                </div>

                <div className="story-pill-item">
                  <span className="story-pill-icon">⚡</span>
                  <div>
                    <h4 className="story-pill-title">Busserz API Persistent Sync</h4>
                    <p className="story-pill-desc">Live environment data synced once and cached in local backend JSON.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. GUEST REVIEWS */}
      <section className="section-pad" style={{ paddingTop: 0 }}>
        <div className="container-wide">
          <div className="section-header anim-rise">
            <span className="badge">Guest Experiences</span>
            <h2>What People Are Saying</h2>
            <p>Read authentic feedback from guests who dined with us recently.</p>
          </div>

          <div className="cards-grid anim-rise-delay">
            <article className="review-card">
              <div className="review-stars">★★★★★</div>
              <p className="review-text">
                &quot;The Flame Bowl Signature is easily the best dinner I&apos;ve had in town. Rich smoky flavors and incredible presentation!&quot;
              </p>
              <div className="review-author">
                <div className="author-avatar">E</div>
                <div>
                  <div className="author-name">Elena Rostova</div>
                  <div className="author-role">Food Critic & Local Guide</div>
                </div>
              </div>
            </article>

            <article className="review-card">
              <div className="review-stars">★★★★★</div>
              <p className="review-text">
                &quot;The Bubble Waffles and Crêpes are out of this world! Perfect sweetness, fresh fruit, and incredibly fast service.&quot;
              </p>
              <div className="review-author">
                <div className="author-avatar">M</div>
                <div>
                  <div className="author-name">Marcus Lindqvist</div>
                  <div className="author-role">Verified Diner</div>
                </div>
              </div>
            </article>

            <article className="review-card">
              <div className="review-stars">★★★★★</div>
              <p className="review-text">
                &quot;Amazing digital experience and instant menu loading. You can tell they care deeply about both hospitality and tech.&quot;
              </p>
              <div className="review-author">
                <div className="author-avatar">S</div>
                <div>
                  <div className="author-name">Sophia Chen</div>
                  <div className="author-role">Regular Guest</div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 7. CTA BANNER */}
      <section className="container-wide anim-rise">
        <div className="cta-banner">
          <h2>Ready For An Unforgettable Dining Table?</h2>
          <p>Book a private table for your team or family, or order your favorite workspace pantry items online.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/contact" className="btn-primary">
              Reserve Your Table Now
            </Link>
            <Link href="/menu" className="btn-ghost">
              Explore Full Menu
            </Link>
          </div>
        </div>
      </section>

      {/* 8. BACKEND PERSISTENCE CACHE BAR */}
      <section className="container-wide" style={{ marginTop: "3rem" }}>
        <CacheStatusControl />
      </section>
    </div>
  );
}
