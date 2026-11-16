import { useCart } from "@/lib/cart";
import { useCustomer } from "@/lib/customer";
import { useLang } from "@/lib/i18n";
import { OFFER_PRODUCTS } from "@/lib/products";
import { useSiteContent } from "@/lib/site-content";
import { WHOLESALE_MIN, stockOf, unitPrice, wholesaleFor } from "@/lib/wholesale";

/**
 * The cart lines with their prices, shared by the cart page and the side drawer. Prices are read from the product source
 * every time, never from the cart. Wholesale counts the pieces of this one listing only: the cart keeps one line per
 * listing, so other shops or other products never add up to 5. Only a signed-in customer gets it; checkout prices the order
 * on the server again.
 */
export function useCartPricing() {
  const { t, lang } = useLang();
  const { content, copyOf, productById, shopOf, catalogue } = useSiteContent();
  const { lines } = useCart();
  const { customer } = useCustomer();

  const rows = lines.map((line) => {
    const product = productById(line.id) ?? OFFER_PRODUCTS.find((item) => item.id === line.id);
    const copy = copyOf(lang, line.id) ?? t.deals.products[line.id];
    const source = content.products.find((item) => item.id === line.id);
    const wholesale = source ? wholesaleFor(source) : null;
    const priced = source ? unitPrice(source, line.qty, customer !== null) : { unit: product?.price ?? 0, wholesale: false };
    // One piece short of wholesale, with a valid wholesale price and enough recorded stock for 5.
    const nudge = source !== undefined && wholesale !== null && line.qty === WHOLESALE_MIN - 1 && stockOf(source) >= WHOLESALE_MIN;
    const shop = source ? shopOf(source.id) : null;
    return { line, product, copy, priced, wholesale, nudge, shop };
  });
  const total = rows.reduce((sum, row) => sum + row.priced.unit * row.line.qty, 0);
  const pieces = rows.reduce((sum, row) => sum + row.line.qty, 0);
  const anyWholesale = rows.some((row) => row.priced.wholesale);

  return { rows, total, pieces, anyWholesale, signedIn: customer !== null, local: catalogue.source === "local" };
}
