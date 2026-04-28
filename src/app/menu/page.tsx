import Image from "next/image";
import { getBusserzMenus } from "@/lib/busserz";

export default async function MenuPage() {
  const menuSections = await getBusserzMenus();

  return (
    <div className="page-shell">
      <div className="container-wide anim-rise">
        <h1 className="page-title">Our Menus</h1>
        <p className="page-subtitle">
          Live menu data from your Busserz space with categories and product
          listings.
        </p>
      </div>

      <div className="container-wide menu-grid anim-rise-delay">
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