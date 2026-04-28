import type { MenuSection } from "@/types/menu";
import type { Product } from "@/types/product";

type RawEntity = Record<string, unknown>;

const BUSSERZ_API_BASE = process.env.BUSSERZ_API_BASE ?? "https://data.busserz.com/v2";
const BUSSERZ_API_KEY = process.env.BUSSERZ_API_KEY ?? "IahObeaKZBCyn0gqo01wVLdrJMnUH0ye";
const BUSSERZ_SPACE_ID = process.env.BUSSERZ_SPACE_ID ?? "PK00001001";

function textFromLocalized(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const record = value as Record<string, unknown>;
  const en = record.en;
  if (typeof en === "string") {
    return en;
  }

  for (const nested of Object.values(record)) {
    if (typeof nested === "string") {
      return nested;
    }
    if (nested && typeof nested === "object") {
      const nestedRecord = nested as Record<string, unknown>;
      if (typeof nestedRecord.en === "string") {
        return nestedRecord.en;
      }
    }
  }

  return "";
}

function resolveName(entity: RawEntity): string {
  const name = entity.name;
  if (typeof name === "string") {
    return name;
  }
  if (name && typeof name === "object") {
    const nestedName = name as Record<string, unknown>;
    return (
      textFromLocalized(nestedName.public) ||
      textFromLocalized(nestedName.short) ||
      textFromLocalized(nestedName.system) ||
      "Untitled"
    );
  }
  return "Untitled";
}

function resolveDescription(entity: RawEntity): string {
  const description = entity.description;
  if (typeof description === "string") {
    return description;
  }
  if (!description || typeof description !== "object") {
    return "";
  }

  const nested = description as Record<string, unknown>;
  return (
    textFromLocalized(nested.public) ||
    textFromLocalized(nested.short) ||
    textFromLocalized(nested.full) ||
    ""
  );
}

function resolveCategory(entity: RawEntity): string {
  const categories = entity.categories;
  if (!Array.isArray(categories) || categories.length === 0) {
    return "General";
  }

  const firstCategory = categories[0];
  if (!firstCategory || typeof firstCategory !== "object") {
    return "General";
  }

  return resolveName(firstCategory as RawEntity);
}

async function fetchBusserz(path: string): Promise<unknown> {
  const response = await fetch(`${BUSSERZ_API_BASE}/${path}`, {
    headers: {
      "x-bz-api-key": BUSSERZ_API_KEY,
      "x-bz-space-id": BUSSERZ_SPACE_ID,
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Busserz API request failed for ${path} with ${response.status}`);
  }

  return response.json();
}

export async function getBusserzProducts(): Promise<Product[]> {
  const raw = await fetchBusserz("products");
  const payload = (raw ?? {}) as { items?: unknown[] };
  const items = Array.isArray(payload.items) ? payload.items : [];

  return items
    .filter((item): item is RawEntity => !!item && typeof item === "object")
    .map((item) => {
      const rawPrice = item.price;
      const price = typeof rawPrice === "number" ? rawPrice : Number(rawPrice ?? 0);

      return {
        id: String(item.id ?? crypto.randomUUID()),
        name: resolveName(item),
        description: resolveDescription(item) || "No description available.",
        price: Number.isFinite(price) ? price : 0,
        category: resolveCategory(item),
      } satisfies Product;
    });
}

export async function getBusserzMenus(): Promise<MenuSection[]> {
  const raw = await fetchBusserz("menus");
  const payload = (raw ?? {}) as { items?: unknown[] };
  const items = Array.isArray(payload.items) ? payload.items : [];

  return items
    .filter((item): item is RawEntity => !!item && typeof item === "object")
    .map((menu) => {
      const products = Array.isArray(menu.products) ? menu.products : [];

      const normalizedProducts = products
        .filter((item): item is RawEntity => !!item && typeof item === "object")
        .map((product) => {
          const rawPrice = product.price;
          const price = typeof rawPrice === "number" ? rawPrice : Number(rawPrice ?? 0);

          return {
            id: String(product.id ?? crypto.randomUUID()),
            name: resolveName(product),
            details: resolveDescription(product) || "Chef recommendation",
            price: Number.isFinite(price) ? price : 0,
          };
        });

      return {
        id: String(menu.id ?? crypto.randomUUID()),
        title: resolveName(menu),
        description: resolveDescription(menu),
        items: normalizedProducts,
      } satisfies MenuSection;
    });
}