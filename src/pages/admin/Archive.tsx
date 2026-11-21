import { useState } from "react";
import { Archive as ArchiveIcon, ArchiveRestore, Inbox } from "lucide-react";
import { allCategories } from "@/lib/catalog";
import { useSiteContent } from "@/lib/site-content";
import { Badge, Button, Empty, PageHead, Pager, Panel, sar, Tabs, usePager } from "./ui";
import { useOps } from "./ops";
import { useShopScope } from "./shopScope";

type Kind = "products" | "departments" | "shops" | "orders";
type Row = { id: string; title: string; note: string; restore: () => void };

/** Everything that was deleted from the lists, in one place: products, departments, shops and orders. Nothing here is gone; each row can be restored. */
export function Archive() {
  const { content, shops, setShopState, setCategoryArchived, updateProduct } = useSiteContent();
  const { archivedOrders, archiveOrder } = useOps();
  const [kind, setKind] = useState<Kind>("products");
  // A shop sees only its own archived products (the shop dashboard's pages are already narrowed to that shop).
  const ownShop = useShopScope() !== null;

  const rows: Record<Kind, Row[]> = {
    products: content.products
      .filter((item) => item.archived)
      .map((item) => ({ id: item.id, title: item.nameAr, note: sar.format(item.price), restore: () => updateProduct(item.id, { archived: false }) })),
    departments: allCategories()
      .filter((item) => content.categoryArchived.includes(item.id))
      .map((item) => ({ id: item.id, title: item.nameAr, note: item.nameEn, restore: () => setCategoryArchived(item.id, false) })),
    shops: shops
      .filter((item) => item.archived)
      .map((item) => ({ id: item.id, title: item.name, note: item.city ?? "", restore: () => void setShopState(item.id, { archived: false }) })),
    orders: archivedOrders.map((item) => ({ id: item.id, title: `الطلب #${item.id}`, note: `${item.customer} · ${sar.format(item.total)}`, restore: () => archiveOrder(item.id, false) })),
  };
  const tabs: Array<[Kind, string]> = ownShop
    ? [["products", "المنتجات"]]
    : [
        ["products", "المنتجات"],
        ["departments", "الأقسام"],
        ["shops", "المحلات"],
        ["orders", "الطلبات"],
      ];
  const list = rows[kind];
  const pager = usePager(list, kind);

  return (
    <div className="space-y-6">
      <PageHead title="الأرشيف" lead={ownShop ? "منتجاتك اللي حذفتها تتجمع هنا. بياناتها محفوظة وتقدر تسترجعها في أي وقت." : "كل اللي حذفته من القوائم يتجمع هنا. بياناته محفوظة وتقدر تسترجعه في أي وقت."} />
      {ownShop ? null : <Tabs value={kind} onChange={setKind} items={tabs.map(([id, label]) => [id, label, rows[id].length] as [Kind, string, number])} />}
      <Panel>
        {list.length === 0 ? (
          <Empty icon={Inbox} title="الأرشيف فاضي هنا" lead="العناصر المحذوفة من هذا القسم تظهر هنا." />
        ) : (
          <ul className="divide-y divide-(--a-line)">
            {pager.rows.map((row) => (
              <li key={row.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--a-surface-2) text-(--a-muted)">
                  <ArchiveIcon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{row.title}</span>
                  {row.note ? <span className="block truncate text-xs text-(--a-muted)">{row.note}</span> : null}
                </span>
                <Badge tone="warn">محذوف</Badge>
                <Button icon={ArchiveRestore} onClick={row.restore}>
                  استرجاع
                </Button>
              </li>
            ))}
          </ul>
        )}
        <Pager pager={pager} />
      </Panel>
    </div>
  );
}
