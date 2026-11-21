import { createContext, useContext, useMemo, type ReactNode } from "react";
import { PREVIEW } from "@/lib/api";
import { SiteContentContext, useSiteContent, type ProductRow } from "@/lib/site-content";
import { OpsContext, useOps } from "./ops";
import { DEMO_SHOP_ORDERS } from "./orders";

const ShopScopeContext = createContext<{ shopId: string; requests: ProductRow[] } | null>(null);

/** The shop whose dashboard is open, or null in the admin dashboard. */
export function useShopScope() {
  return useContext(ShopScopeContext)?.shopId ?? null;
}

/** The products this shop sent to the admin that are still waiting or were refused. They are not counted as the shop's products. */
export function useShopRequests() {
  return useContext(ShopScopeContext)?.requests ?? [];
}

/**
 * Lets the admin pages run as one shop's dashboard: inside it, the pages see only that shop's products, the shop
 * itself, and the orders that contain its products. Nothing else in the pages changes.
 * Must sit inside the site content and ops providers.
 */
export function ShopScope({ shopId, children }: { shopId: string; children: ReactNode }) {
  const site = useSiteContent();
  const ops = useOps();

  // A demo shop also lists the products its display-only orders are for, so products and orders agree in the preview.
  const demoOrders = useMemo(() => (PREVIEW ? DEMO_SHOP_ORDERS.filter((order) => order.shopId === shopId) : []), [shopId]);
  const own = useMemo(() => {
    const demoIds = new Set(demoOrders.flatMap((order) => (order.lines ?? []).map((line) => line.id)));
    return site.content.products.flatMap((item) => (item.shopId === shopId ? [item] : demoIds.has(item.id) ? [{ ...item, shopId }] : []));
  }, [site.content.products, shopId, demoOrders]);
  // Products still waiting for the admin (or refused) are requests, not products: every page counts only approved ones.
  const products = useMemo(() => own.filter((item) => !item.approval), [own]);
  const requests = useMemo(() => own.filter((item) => item.approval), [own]);
  const siteValue = useMemo(
    () => ({ ...site, content: { ...site.content, products }, shops: site.shops.filter((shop) => shop.id === shopId) }),
    [site, products, shopId],
  );

  const mine = useMemo(() => new Set(products.map((item) => item.id)), [products]);
  // Display-only orders carry the shop they belong to; every other order belongs to the shops whose products it contains.
  // A demo shop sees only its own display-only orders: the store's sample orders happen to share its product ids.
  const isDemoShop = demoOrders.length > 0;
  const ofShop = (order: (typeof ops.orders)[number]) =>
    order.shopId || isDemoShop ? order.shopId === shopId : order.lines?.length ? order.lines.some((line) => mine.has(line.id)) : mine.has(order.productId);
  // The demo shop's display-only orders come with the dashboard's orders (see OpsProvider) and are picked out by shop id above.
  const opsValue = useMemo(
    () => ({ ...ops, orders: ops.orders.filter(ofShop), archivedOrders: ops.archivedOrders.filter(ofShop) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ops, mine, isDemoShop],
  );

  return (
    <ShopScopeContext.Provider value={{ shopId, requests }}>
      <SiteContentContext.Provider value={siteValue}>
        <OpsContext.Provider value={opsValue}>{children}</OpsContext.Provider>
      </SiteContentContext.Provider>
    </ShopScopeContext.Provider>
  );
}
