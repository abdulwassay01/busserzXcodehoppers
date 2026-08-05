import { getBusserzMenus } from "@/lib/busserz";
import { ClientMenuView } from "@/components/client-menu-view";

export default async function MenuPage() {
  const initialMenus = await getBusserzMenus();

  return (
    <div className="page-shell">
      <div className="container-wide anim-rise">
        <h1 className="page-title">Our Menus</h1>
        <p className="page-subtitle">
          Live menu data from your Busserz space with categories and product listings, stored in backend JSON and served from there.
        </p>

        <ClientMenuView initialMenus={initialMenus} />
      </div>
    </div>
  );
}