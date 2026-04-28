import { getBusserzProducts } from "@/lib/busserz";
import type { Product } from "@/types/product";

export async function getProducts(): Promise<Product[]> {
  return getBusserzProducts();
}