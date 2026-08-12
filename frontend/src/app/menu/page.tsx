import { getBusserzMenus } from "@/lib/busserz";
import { ClientMenuView } from "@/components/client-menu-view";
import { CacheStatusControl } from "@/components/cache-status";

export default async function MenuPage() {
  const initialMenus = await getBusserzMenus();

  return (
    <div className="page-shell">
      <div className="container-wide anim-rise">
        <h1 className="page-title">Our Menus</h1>
        <p className="page-subtitle">
          Live menu data from your Busserz workspace. Stored in backend JSON, served locally, and auto-invalidated whenever the space ID or token updates.
        </p>

        <CacheStatusControl cacheKey="menu" />

        <ClientMenuView initialMenus={initialMenus} />
      </div>
    </div>
  );
}