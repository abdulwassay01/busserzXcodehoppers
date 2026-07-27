import Image from "next/image";
import { getBusserzMenusWithMeta } from "@/lib/busserz";
import { CacheStatusControl } from "@/components/cache-status";

export default async function MenuPage() {
  const { data: menuSections, source, timestamp, ttlRemainingSeconds } = await getBusserzMenusWithMeta();

  const formattedTime = new Date(timestamp).toLocaleTimeString();

  return (
    <div className="page-shell">
      <div className="container-wide anim-rise">
        <h1 className="page-title">Our Menus</h1>
        <p className="page-subtitle">
          Live menu data from your Busserz space with categories and product listings, served via our auto-expiring cache layer.
        </p>

        <CacheStatusControl cacheKey="menu" />

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

      <div className="container-wide menu-grid anim-rise-delay" style={{ marginTop: "1.5rem" }}>
        {menuSections.map((section) => (
          <section className="panel" key={section.title}>
            {section.imageUrl ? (
              <div className="panel-image">
                <Image
                  src={section.imageUrl}
                  alt={section.title}
                  width={400}
                  height={250}
                  unoptimized
                />
              </div>
            ) : (
              <div className="panel-image no-image">No image available</div>
            )}
            <h2 className="section-title">{section.title}</h2>
            {section.description ? <p className="muted">{section.description}</p> : null}
            <ul className="menu-list">
              {section.items.map((item) => (
                <li className="menu-item" key={item.name}>
                  {item.imageUrl ? (
                    <div className="menu-item-image">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={80}
                        height={60}
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="menu-item-image no-image">No image</div>
                  )}
                  <div className="menu-item-content">
                    <strong>{item.name}</strong>
                    <p className="muted">{item.details}</p>
                  </div>
                  <strong>${item.price.toFixed(2)}</strong>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}