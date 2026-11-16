import { OPS_STORAGE_KEY } from "@/pages/admin/ops";

/**
 * Wholesale price per piece for one shop's listing of a product: it applies from 5 pieces of that same listing
 * (same product at the same shop; listings of different shops or different products are never added together) for a
 * signed-in customer. It is entered once per product. For now it lives only in this browser with the product data:
 * the store's server and checkout know nothing about it.
 */
export const WHOLESALE_MIN = 5;

type PricedRow = { price: number; wholesalePrice?: number | null };

/** The wholesale price when it is valid: a positive number below the current selling price. Otherwise null. */
export function validWholesale(row: PricedRow | undefined): number | null {
  const value = row?.wholesalePrice;
  return row && typeof value === "number" && Number.isFinite(value) && value > 0 && value < row.price ? value : null;
}

/** The wholesale price a listing really offers: valid, and listed by a shop (it is a per-shop offer). Otherwise null. */
export function wholesaleFor(row: (PricedRow & { shopId?: string | null }) | undefined): number | null {
  return row?.shopId ? validWholesale(row) : null;
}

/** Unit price for a quantity of one listing: the wholesale price from 5 pieces for a signed-in customer, else the selling price. */
export function unitPrice(row: PricedRow & { shopId?: string | null }, qty: number, signedIn: boolean) {
  const wholesale = wholesaleFor(row);
  return wholesale !== null && signedIn && qty >= WHOLESALE_MIN ? { unit: wholesale, wholesale: true } : { unit: row.price, wholesale: false };
}

/** Pieces in stock for a listing; Infinity when no stock is recorded for it. */
export function stockOf(row: { id: string; stock?: number | null }): number {
  if (typeof row.stock === "number") return row.stock;
  try {
    const saved = (JSON.parse(localStorage.getItem(OPS_STORAGE_KEY) ?? "{}") as { stock?: Record<string, number> }).stock?.[row.id];
    if (typeof saved === "number") return saved;
  } catch {
    // Unreadable stock: treated as not recorded.
  }
  return Infinity;
}
