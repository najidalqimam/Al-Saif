import { useMemo, useState } from "react";
import { BadgePercent, Boxes, PackageSearch, Plus, ShoppingCart, Tag, TrendingDown, Wallet } from "lucide-react";
import { ProductArt } from "@/components/site/card-art";
import { useSiteContent, type ProductRow } from "@/lib/site-content";
import { OrderDrawer, OrdersTable } from "../admin/OrdersPage";
import { STOCK_LEVEL, stockLevel, useOps } from "../admin/ops";
import type { Order } from "../admin/orders";
import { Badge, Button, DemoNote, Empty, num, NumberField, PageHead, Pager, Panel, SearchBox, StatCard, Tabs, sar, usePager } from "../admin/ui";

export type ShopView = "overview" | "products" | "orders" | "offers" | "newProduct";

/** The live (not archived) products that belong to this shop. */
export function useShopProducts(shopId: string): ProductRow[] {
  const { content } = useSiteContent();
  return useMemo(() => content.products.filter((item) => item.shopId === shopId && !item.archived), [content.products, shopId]);
}

/** The shop's published products: the ones still waiting for the admin, or refused, are not counted as live. */
function useLiveShopProducts(shopId: string): ProductRow[] {
  return useShopProducts(shopId).filter((item) => !item.approval);
}

/** Orders that contain at least one product of this shop. */
function useShopOrders(shopId: string): Order[] {
  const { orders } = useOps();
  const mine = new Set(useShopProducts(shopId).map((item) => item.id));
  return orders.filter((order) => (order.lines?.length ? order.lines.some((line) => mine.has(line.id)) : mine.has(order.productId)));
}

export function ShopOverview({ shopId, onOpen }: { shopId: string; onOpen: (view: ShopView) => void }) {
  const products = useLiveShopProducts(shopId);
  const orders = useShopOrders(shopId);
  const { ops } = useOps();
  const kept = orders.filter((order) => order.status !== "cancelled");
  const sales = kept.reduce((sum, order) => sum + order.total, 0);
  const waiting = orders.filter((order) => order.status === "new").length;
  const attention = products.filter((item) => {
    const level = stockLevel(ops.stock[item.id], ops.lowStock);
    return level === "low" || level === "out";
  }).length;
  const [viewing, setViewing] = useState<Order | null>(null);

  return (
    <div className="space-y-6">
      <PageHead title="نظرة عامة" lead="ملخص مبيعات محلك وطلباته ومنتجاته." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="المبيعات" value={sar.format(sales)} note={`من ${num.format(kept.length)} طلب غير ملغي`} icon={Wallet} tone="blue" onClick={() => onOpen("orders")} />
        <StatCard label="الطلبات" value={num.format(orders.length)} note={`${num.format(waiting)} جديد بانتظار التجهيز`} icon={ShoppingCart} tone={waiting ? "warn" : "blue"} onClick={() => onOpen("orders")} />
        <StatCard label="منتجاتي" value={num.format(products.length)} note={`${num.format(products.filter((item) => !item.hidden).length)} ظاهر في المتجر`} icon={Tag} tone="blue" onClick={() => onOpen("products")} />
        <StatCard label="مخزون يحتاج انتباه" value={num.format(attention)} note="منخفض أو نافد" icon={Boxes} tone={attention ? "warn" : "ok"} onClick={() => onOpen("products")} />
      </div>
      <Panel title="آخر الطلبات" lead="الطلبات اللي فيها منتجات من محلك">
        {orders.length ? <OrdersTable orders={orders.slice(0, 5)} onView={setViewing} compact /> : <Empty icon={ShoppingCart} title="ما فيه طلبات بعد" lead="تظهر هنا الطلبات اللي تحتوي على منتجات محلك." />}
      </Panel>
      <OrderDrawer order={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

type StockFilter = "all" | "low" | "out";

export function ShopProducts({ shopId, onOpen }: { shopId: string; onOpen: (view: ShopView) => void }) {
  const products = useShopProducts(shopId);
  const { updateProduct } = useSiteContent();
  const { ops, setStock } = useOps();
  const [filter, setFilter] = useState<StockFilter>("all");
  const [query, setQuery] = useState("");
  const levelOf = (id: string) => stockLevel(ops.stock[id], ops.lowStock);
  const needle = query.trim().toLowerCase();
  const rows = products.filter((item) => {
    if (filter !== "all" && levelOf(item.id) !== filter) return false;
    return !needle || [item.nameAr, item.nameEn, item.categoryAr].some((text) => text.toLowerCase().includes(needle));
  });
  const pager = usePager(rows, `${filter}|${query}`);
  const count = (level: "low" | "out") => products.filter((item) => levelOf(item.id) === level).length;

  return (
    <div className="space-y-6">
      <PageHead
        title="منتجاتي والمخزون"
        lead="أسعار منتجات محلك وكمياتها وحالة المنتجات اللي أرسلتها للإدارة."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => onOpen("newProduct")}>
            إضافة منتج
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={filter} onChange={setFilter} items={[["all", "الكل", products.length], ["low", STOCK_LEVEL.low.label, count("low")], ["out", STOCK_LEVEL.out.label, count("out")]]} />
        <SearchBox value={query} onChange={setQuery} placeholder="ابحث باسم المنتج" />
      </div>
      <Panel>
        {rows.length ? (
          <ul className="divide-y divide-(--a-line)">
            {pager.rows.map((item) => {
              const level = STOCK_LEVEL[levelOf(item.id)];
              return (
                <li key={item.id} className="flex flex-wrap items-center gap-4 px-5 py-2.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--a-surface-2)">
                    <ProductArt id={item.id} className="size-8" />
                  </span>
                  <div className="min-w-40 flex-1">
                    <p className="font-medium">{item.nameAr}</p>
                    <p className="mt-0.5 text-xs text-(--a-muted)">
                      {item.categoryAr}
                      {item.hidden && !item.approval ? " · مخفي في المتجر" : ""}
                    </p>
                    {item.approval === "rejected" && item.rejectReason ? <p className="mt-1 text-xs text-(--a-danger)">سبب الرفض: {item.rejectReason}</p> : null}
                  </div>
                  {item.approval === "pending" ? <Badge tone="warn">قيد مراجعة الإدارة</Badge> : item.approval === "rejected" ? <Badge tone="danger">مرفوض</Badge> : <Badge tone={level.tone}>{level.label}</Badge>}
                  {item.approval ? (
                    <p className="w-full text-end text-sm font-semibold tabular-nums sm:w-96">{sar.format(item.price)}</p>
                  ) : (
                  <div className="grid w-full grid-cols-3 gap-2 sm:w-96">
                    <NumberField label="السعر" suffix="ر.س" value={item.price} onChange={(value) => updateProduct(item.id, { price: value ?? 0 })} />
                    <NumberField label="سعر الجملة" suffix="ر.س" placeholder="—" value={item.wholesalePrice ?? null} onChange={(value) => updateProduct(item.id, { wholesalePrice: value })} />
                    <NumberField label="الكمية" suffix="قطعة" placeholder="—" value={ops.stock[item.id] ?? null} onChange={(value) => setStock(item.id, value)} />
                  </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty icon={PackageSearch} title="ما فيه منتجات هنا" lead={products.length ? "غيّر الفلتر أو كلمة البحث." : "ما فيه منتجات مرتبطة بمحلك. تربطها الإدارة من صفحة تعديل المنتج."} />
        )}
        <Pager pager={pager} />
      </Panel>
    </div>
  );
}

export function ShopOrders({ shopId }: { shopId: string }) {
  const orders = useShopOrders(shopId);
  const [viewing, setViewing] = useState<Order | null>(null);
  return (
    <div className="space-y-6">
      <PageHead title="الطلبات" lead="الطلبات اللي فيها منتجات من محلك." />
      <Panel>{orders.length ? <OrdersTable orders={orders} onView={setViewing} /> : <Empty icon={ShoppingCart} title="ما فيه طلبات بعد" lead="تظهر هنا الطلبات اللي تحتوي على منتجات محلك." />}</Panel>
      <OrderDrawer order={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

/** Wholesale prices and the comparison with other shops listing the same product (same explicit matchKey). */
export function ShopOffers({ shopId }: { shopId: string }) {
  const products = useLiveShopProducts(shopId);
  const { offersOf } = useSiteContent();
  const [filter, setFilter] = useState<"wholesale" | "compare">("wholesale");
  const wholesale = products.filter((item) => item.wholesalePrice != null);
  const compared = products
    .filter((item) => item.matchKey)
    .map((item) => {
      const others = offersOf(item.id).filter((offer) => offer.id !== item.id);
      const cheapest = others.length ? Math.min(...others.map((offer) => offer.price)) : null;
      return { item, others, cheapest };
    })
    .filter((row) => row.others.length);
  const higher = compared.filter((row) => row.cheapest != null && row.item.price > row.cheapest).length;
  const rows = filter === "wholesale" ? wholesale : compared.map((row) => row.item);
  const pager = usePager(rows, filter);

  return (
    <div className="space-y-6">
      <PageHead title="العروض والجملة" lead="أسعار الجملة لمنتجاتك، وموقعك في مقارنة الأسعار مع المحلات الأخرى." />
      <DemoNote title="معاينة محلية">أسعار الجملة والمقارنة تتحفظ في هذا المتصفح فقط وليست على السيرفر.</DemoNote>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="منتجات بسعر جملة" value={num.format(wholesale.length)} note="من 5 قطع" icon={BadgePercent} tone="blue" onClick={() => setFilter("wholesale")} />
        <StatCard label="منتجات في المقارنة" value={num.format(compared.length)} note="تعرضها محلات ثانية" icon={Tag} tone="blue" onClick={() => setFilter("compare")} />
        <StatCard label="سعرك أعلى من الأرخص" value={num.format(higher)} note="يستاهل مراجعة السعر" icon={TrendingDown} tone={higher ? "warn" : "ok"} onClick={() => setFilter("compare")} />
      </div>
      <Tabs value={filter} onChange={setFilter} items={[["wholesale", "أسعار الجملة", wholesale.length], ["compare", "مقارنة الأسعار", compared.length]]} />
      <Panel>
        {rows.length ? (
          <ul className="divide-y divide-(--a-line)">
            {pager.rows.map((item) => {
              const row = compared.find((entry) => entry.item.id === item.id);
              return (
                <li key={item.id} className="flex flex-wrap items-center gap-4 px-5 py-2.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--a-surface-2)">
                    <ProductArt id={item.id} className="size-8" />
                  </span>
                  <div className="min-w-40 flex-1">
                    <p className="font-medium">{item.nameAr}</p>
                    <p className="mt-0.5 text-xs text-(--a-muted)">سعرك {sar.format(item.price)}</p>
                  </div>
                  {filter === "wholesale" ? (
                    <Badge tone="ok">جملة {sar.format(item.wholesalePrice ?? 0)}</Badge>
                  ) : row?.cheapest != null ? (
                    <>
                      <span className="text-xs text-(--a-muted)">{num.format(row.others.length)} محل ثاني · أرخص سعر {sar.format(row.cheapest)}</span>
                      <Badge tone={item.price > row.cheapest ? "warn" : "ok"}>{item.price > row.cheapest ? "أغلى من الأرخص" : "الأرخص أو مساوي"}</Badge>
                    </>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty icon={PackageSearch} title="ما فيه شيء هنا" lead={filter === "wholesale" ? "حدد سعر جملة من صفحة منتجاتي." : "ما فيه منتجات لك تعرضها محلات ثانية."} />
        )}
        <Pager pager={pager} />
      </Panel>
    </div>
  );
}
