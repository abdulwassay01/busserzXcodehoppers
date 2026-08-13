import type { MenuSection } from "@/types/menu";
import type { Product } from "@/types/product";
import { serverCache } from "@/lib/cache";

export type RawEntity = Record<string, unknown>;

export type PersistedEnvelope<T> = {
  data: T;
  savedAt: string;
  apiKey?: string;
  spaceId?: string;
};

const BUSSERZ_API_BASE = process.env.BUSSERZ_API_BASE ?? "https://data.busserz.com/v2";
const BUSSERZ_API_KEY = process.env.BUSSERZ_API_KEY ?? "Y2tqOjpuAUmjo9Gqsayc1o1KKVSfkXsq";
const BUSSERZ_SPACE_ID = process.env.BUSSERZ_SPACE_ID ?? "PK00001002";
export function getBackendApiBase(): string {
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_API_BASE;
  if (envUrl && envUrl.trim() !== "" && !envUrl.includes("localhost")) {
    return envUrl;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.BACKEND_API_BASE ?? "http://localhost:4000";
}

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const SHOULD_SKIP_BACKEND_PERSISTENCE = process.env.NEXT_PHASE === "phase-production-build";

export function safeString(value: unknown, fallback: string = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.en === "string" && record.en.trim() !== "") return record.en;
    for (const val of Object.values(record)) {
      if (typeof val === "string" && val.trim() !== "") return val;
      if (val && typeof val === "object") {
        const nested = safeString(val, "");
        if (nested) return nested;
      }
    }
  }
  return fallback;
}

function resolveName(entity: RawEntity): string {
  if (!entity || typeof entity !== "object") return "Untitled";
  const name = entity.name;
  if (typeof name === "string") return name;
  if (name && typeof name === "object") {
    const record = name as Record<string, unknown>;
    const res =
      safeString(record.public) ||
      safeString(record.short) ||
      safeString(record.system) ||
      safeString(record);
    if (res) return res;
  }
  return safeString(entity.internal ? (entity.internal as Record<string, unknown>).name : "", "Untitled");
}

function resolveDescription(entity: RawEntity): string {
  if (!entity || typeof entity !== "object") return "";
  const desc = entity.description;
  if (typeof desc === "string") return desc;
  if (desc && typeof desc === "object") {
    const record = desc as Record<string, unknown>;
    const res =
      safeString(record.public) ||
      safeString(record.short) ||
      safeString(record.full) ||
      safeString(record);
    if (res) return res;
  }
  return safeString(entity.internal ? (entity.internal as Record<string, unknown>).short_description : "", "");
}

function resolveCategory(entity: RawEntity): string {
  const categories = entity.categories;
  if (!Array.isArray(categories) || categories.length === 0) {
    return "General";
  }
  const first = categories[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object") {
    return resolveName(first as RawEntity);
  }
  return "General";
}

function resolveImageUrl(entity: RawEntity): string | undefined {
  if (!entity || typeof entity !== "object") return undefined;

  // Direct string or object properties
  for (const key of ["imageUrl", "image_url", "image", "thumbnail", "cover", "picture"]) {
    const val = entity[key];
    if (typeof val === "string" && val.trim() !== "") return val;
    if (val && typeof val === "object") {
      const obj = val as Record<string, unknown>;
      if (typeof obj.url === "string" && obj.url.trim() !== "") return obj.url;
    }
  }

  // Array properties: assets, media, images
  for (const key of ["assets", "media", "images"]) {
    const arr = entity[key];
    if (Array.isArray(arr) && arr.length > 0) {
      for (const item of arr) {
        if (typeof item === "string" && item.trim() !== "") return item;
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          if (typeof record.url === "string" && record.url.trim() !== "") return record.url;
          if (typeof record.src === "string" && record.src.trim() !== "") return record.src;
          if (typeof record.path === "string" && record.path.trim() !== "") return record.path;
        }
      }
    }
  }

  // Internal property
  if (entity.internal && typeof entity.internal === "object") {
    return resolveImageUrl(entity.internal as RawEntity);
  }

  return undefined;
}

export function normalizeProduct(item: RawEntity): Product {
  const rawPrice = item.price;
  const price = typeof rawPrice === "number" ? rawPrice : Number(rawPrice ?? 0);

  return {
    id: safeString(item.id ?? item._id, crypto.randomUUID()),
    name: resolveName(item),
    description: resolveDescription(item) || "No description available.",
    price: Number.isFinite(price) ? price : 0,
    category: resolveCategory(item),
    imageUrl: resolveImageUrl(item),
  };
}

export function normalizeMenuSection(menu: RawEntity): MenuSection {
  const products = Array.isArray(menu.products) ? menu.products : [];
  const normalizedProducts = products
    .filter((item): item is RawEntity => !!item && typeof item === "object")
    .map((product) => {
      const rawPrice = product.price;
      const price = typeof rawPrice === "number" ? rawPrice : Number(rawPrice ?? 0);
      return {
        id: safeString(product.id ?? product._id, crypto.randomUUID()),
        name: resolveName(product),
        details: resolveDescription(product) || "Chef recommendation",
        price: Number.isFinite(price) ? price : 0,
        imageUrl: resolveImageUrl(product),
      };
    });

  return {
    id: safeString(menu.id ?? menu._id ?? menu.menuId, crypto.randomUUID()),
    title: resolveName(menu),
    description: resolveDescription(menu),
    imageUrl: resolveImageUrl(menu),
    items: normalizedProducts,
  };
}

async function fetchBusserzDirectly(path: string): Promise<unknown> {
  console.log(`[API FETCH] Fetching fresh data from Busserz API: /${path} (Space: ${BUSSERZ_SPACE_ID})`);
  try {
    const response = await fetch(`${BUSSERZ_API_BASE}/${path}`, {
      headers: {
        "x-bz-api-key": BUSSERZ_API_KEY,
        "x-bz-space-id": BUSSERZ_SPACE_ID,
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.warn(`Busserz API request failed for ${path} with status ${response.status}. Returning empty data.`);
      return { items: [] };
    }

    return response.json();
  } catch (error) {
    console.warn(`Busserz API fetch error for ${path}:`, error instanceof Error ? error.message : String(error));
    return { items: [] };
  }
}

function extractPersistedPayload<T>(input: unknown): PersistedEnvelope<T> | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const record = input as Record<string, unknown>;
  const apiKey = typeof record.apiKey === "string" ? record.apiKey : undefined;
  const spaceId = typeof record.spaceId === "string" ? record.spaceId : undefined;
  const savedAt = typeof record.savedAt === "string" ? record.savedAt : new Date().toISOString();

  const arrayValue = (value: unknown): T | null => {
    if (Array.isArray(value)) {
      return value as T;
    }
    return null;
  };

  const tryExtract = (...keys: string[]) => {
    for (const key of keys) {
      const candidate = record[key];
      if (candidate !== undefined) {
        const result = arrayValue(candidate);
        if (result) {
          return { data: result, savedAt, apiKey, spaceId };
        }
        if (candidate && typeof candidate === "object") {
          const nested = candidate as Record<string, unknown>;
          for (const nestedKey of ["data", "products", "items", "menus"]) {
            const nestedCandidate = nested[nestedKey];
            if (Array.isArray(nestedCandidate)) {
              return {
                data: nestedCandidate as T,
                savedAt: typeof nested.savedAt === "string" ? nested.savedAt : savedAt,
                apiKey: typeof nested.apiKey === "string" ? nested.apiKey : apiKey,
                spaceId: typeof nested.spaceId === "string" ? nested.spaceId : spaceId,
              };
            }
          }
        }
      }
    }
    return null;
  };

  return (
    tryExtract("data") ??
    tryExtract("products") ??
    tryExtract("menus") ??
    tryExtract("items")
  );
}

async function readPersistedData<T>(key: string): Promise<PersistedEnvelope<T> | null> {
  if (SHOULD_SKIP_BACKEND_PERSISTENCE) {
    return null;
  }
  const baseUrl = getBackendApiBase();
  try {
    // 1. Check whether backend reports a change for this key.
    const changedResp = await fetch(`${baseUrl}?key=${key}&check=changed`, {
      cache: 'no-store',
    }).catch(() => null);

    if (changedResp && changedResp.ok) {
      const changedPayload = await changedResp.json().catch(() => null);
      if (changedPayload && changedPayload.changed) {
        console.log(`[BUSSERZ] Invalidation flag set for key=${key}, fetching fresh data from API.`);
        return null;
      }
    }

    // 2. Fetch stored backend JSON data
    const response = await fetch(`${baseUrl}?key=${key}`, {
      cache: 'no-store',
    });
    const cType = response.headers.get("content-type") || "";
    if (!response.ok || !cType.includes("application/json")) {
      return null;
    }

    const payload = await response.json().catch(() => null);
    const rawData = payload && typeof payload === "object" ? (payload as Record<string, unknown>).data ?? payload : payload;
    const persisted = extractPersistedPayload<T>(rawData);
    if (!persisted) {
      return null;
    }

    // 3. Validate Token (API Key) & Space ID (Page ID)
    if (persisted.apiKey && persisted.apiKey !== BUSSERZ_API_KEY) {
      console.log(`[BUSSERZ] Token (apiKey) changed from '${persisted.apiKey}' to '${BUSSERZ_API_KEY}'. Invalidating cache for key=${key}.`);
      return null;
    }

    if (persisted.spaceId && persisted.spaceId !== BUSSERZ_SPACE_ID) {
      console.log(`[BUSSERZ] Space ID changed from '${persisted.spaceId}' to '${BUSSERZ_SPACE_ID}'. Invalidating cache for key=${key}.`);
      return null;
    }

    return persisted;
  } catch (error) {
    console.warn(`Backend read error for ${key}:`, error);
    return null;
  }
}

async function writePersistedData<T>(key: string, data: T): Promise<void> {
  if (SHOULD_SKIP_BACKEND_PERSISTENCE) {
    return;
  }
  const baseUrl = getBackendApiBase();

  try {
    await fetch(`${baseUrl}?key=${key}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        key,
        data: {
          data,
          savedAt: new Date().toISOString(),
          apiKey: BUSSERZ_API_KEY,
          spaceId: BUSSERZ_SPACE_ID,
        } satisfies PersistedEnvelope<T>,
      }),
    });
  } catch (error) {
    console.warn(`Backend write error for ${key}:`, error);
  }
}

async function clearPersistedData(key: string): Promise<void> {
  if (SHOULD_SKIP_BACKEND_PERSISTENCE) {
    return;
  }
  const baseUrl = getBackendApiBase();

  try {
    await fetch(`${baseUrl}/api/data?key=${key}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.warn(`Backend delete error for ${key}:`, error);
  }
}

export interface FetchResultWithMeta<T> {
  data: T;
  source: "cache" | "api";
  timestamp: number;
  expiresAt: number;
  ttlRemainingSeconds: number;
}

export async function getBusserzProductsWithMeta(options?: {
  forceRefresh?: boolean;
  ttlMs?: number;
}): Promise<FetchResultWithMeta<Product[]>> {
  const cacheKey = "products";
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;

  if (options?.forceRefresh) {
    serverCache.delete(cacheKey);
    await clearPersistedData(cacheKey);
  }

  const persisted = await readPersistedData<unknown[]>(cacheKey);
  if (persisted?.data && Array.isArray(persisted.data)) {
    console.log(`[BUSSERZ] Found valid persisted data for key=${cacheKey}, items=${persisted.data.length}`);
    const normalizedData: Product[] = persisted.data.map((item) =>
      typeof item === "object" && item !== null ? normalizeProduct(item as RawEntity) : (item as Product)
    );
    const now = Date.now();
    serverCache.set(cacheKey, normalizedData, ttlMs);

    return {
      data: normalizedData,
      source: "cache",
      timestamp: Date.parse(persisted.savedAt) || now,
      expiresAt: now + ttlMs,
      ttlRemainingSeconds: Math.ceil(ttlMs / 1000),
    };
  }

  serverCache.delete(cacheKey);

  const raw = await fetchBusserzDirectly("products");
  const payload = (raw ?? {}) as { items?: unknown[] };
  const items = Array.isArray(payload.items) ? payload.items : [];
  const freshData = items
    .filter((item): item is RawEntity => !!item && typeof item === "object")
    .map(normalizeProduct);

  await writePersistedData(cacheKey, freshData);
  serverCache.set(cacheKey, freshData, ttlMs);

  return {
    data: freshData,
    source: "api",
    timestamp: Date.now(),
    expiresAt: Date.now() + ttlMs,
    ttlRemainingSeconds: Math.ceil(ttlMs / 1000),
  };
}

export async function getBusserzProducts(): Promise<Product[]> {
  const res = await getBusserzProductsWithMeta();
  return res.data;
}

export async function getBusserzMenusWithMeta(options?: {
  forceRefresh?: boolean;
  ttlMs?: number;
}): Promise<FetchResultWithMeta<MenuSection[]>> {
  const cacheKey = "menus";
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;

  if (options?.forceRefresh) {
    serverCache.delete(cacheKey);
    await clearPersistedData(cacheKey);
  }

  const persisted = await readPersistedData<unknown[]>(cacheKey);
  if (persisted?.data && Array.isArray(persisted.data)) {
    console.log(`[BUSSERZ] Found valid persisted data for key=${cacheKey}, items=${persisted.data.length}`);
    const normalizedData: MenuSection[] = persisted.data.map((item) =>
      typeof item === "object" && item !== null ? normalizeMenuSection(item as RawEntity) : (item as MenuSection)
    );
    const now = Date.now();
    serverCache.set(cacheKey, normalizedData, ttlMs);

    return {
      data: normalizedData,
      source: "cache",
      timestamp: Date.parse(persisted.savedAt) || now,
      expiresAt: now + ttlMs,
      ttlRemainingSeconds: Math.ceil(ttlMs / 1000),
    };
  }

  serverCache.delete(cacheKey);

  const raw = await fetchBusserzDirectly("menus");
  const payload = (raw ?? {}) as { items?: unknown[] };
  const items = Array.isArray(payload.items) ? payload.items : [];
  const freshData = items
    .filter((item): item is RawEntity => !!item && typeof item === "object")
    .map(normalizeMenuSection);

  await writePersistedData(cacheKey, freshData);
  serverCache.set(cacheKey, freshData, ttlMs);

  return {
    data: freshData,
    source: "api",
    timestamp: Date.now(),
    expiresAt: Date.now() + ttlMs,
    ttlRemainingSeconds: Math.ceil(ttlMs / 1000),
  };
}

export async function getBusserzMenus(): Promise<MenuSection[]> {
  const res = await getBusserzMenusWithMeta();
  return res.data;
}