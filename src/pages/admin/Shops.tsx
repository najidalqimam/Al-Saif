import { useEffect, useState } from "react";
import { Pencil, Plus, Store } from "lucide-react";
import { useSiteContent, type Shop } from "@/lib/site-content";
import { onHashMove, pushHash, readHash } from "./nav";
import { Products } from "./Products";
import { ShopFormPage } from "./ShopForm";
import { Badge, Button, DemoNote, Empty, IconButton, num, PageHead, Pager, Panel, rowOpen, usePager } from "./ui";

/** #shops, #shops/add (a new shop), #shops/<id> (its products) or #shops/<id>/edit (its details): each is its own page. */
export function Shops() {
  const [sub, setSub] = useState(() => (readHash().view === "shops" ? readHash().sub : null));
  useEffect(() => onHashMove(() => setSub(readHash().view === "shops" ? readHash().sub : null)), []);
  if (sub === "add") return <ShopFormPage id={null} />;
  if (sub?.endsWith("/edit")) return <ShopFormPage id={sub.slice(0, -5)} />;
  // A shop opens onto its products, still inside the shops section.
  if (sub) return <Products key={sub} shopScope={sub} />;
  return <ShopsList />;
}

/** Shops that list products on the platform: list, add and edit. No delete yet, and no seller accounts. */
function ShopsList() {
  const { content, catalogue, shops } = useSiteContent();
  const saved = catalogue.source === "admin";
  const canEdit = !saved || catalogue.canEdit;
  const pager = usePager(shops);
  const countOf = (id: string) => content.products.filter((item) => item.shopId === id && !item.archived).length;

  // The shop's own page (#shops/<id>): its details and products, without leaving the shops section.
  const openProducts = (shop: Shop) => pushHash("shops", shop.id);

  return (
    <div className="space-y-6">
      <PageHead
        title="المحلات"
        lead="المحلات اللي تعرض منتجاتها في المنصة. تربط كل منتج بمحله من صفحة تعديل المنتج."
        actions={
          canEdit ? (
            <Button variant="primary" icon={Plus} onClick={() => pushHash("shops", "add")}>
              إضافة محل
            </Button>
          ) : null
        }
      />
      {!saved ? (
        <DemoNote title="معاينة محلية">
          المحلات وربطها بالمنتجات تتحفظ في هذا المتصفح فقط وليست على السيرفر. ما تظهر لأي جهاز ثاني، وتختفي لو انمسح تخزين المتصفح.
        </DemoNote>
      ) : null}
      <Panel>
        {shops.length === 0 ? (
          <Empty icon={Store} title="ما فيه محلات بعد" lead="أضف أول محل، وبعدها اربط منتجاتك به من تعديل المنتج." />
        ) : (
          <ul className="divide-y divide-(--a-line)">
            {pager.rows.map((shop) => (
              <li key={shop.id} {...rowOpen(() => openProducts(shop))} className="flex cursor-pointer items-center gap-3 px-5 py-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--a-surface-2) text-(--a-muted)">
                  <Store className="size-5" />
                </span>
                <button type="button" onClick={() => openProducts(shop)} className="min-w-0 flex-1 cursor-pointer truncate text-start font-medium hover:underline" title="عرض منتجات المحل">
                  {shop.name}
                </button>
                <button type="button" onClick={() => openProducts(shop)} aria-label={`عرض منتجات ${shop.name}`} title="عرض منتجات المحل" className="cursor-pointer rounded-full transition hover:opacity-80">
                  <Badge>{num.format(countOf(shop.id))} منتج</Badge>
                </button>
                {canEdit ? <IconButton icon={Pencil} label={`تعديل ${shop.name}`} onClick={() => pushHash("shops", `${shop.id}/edit`)} /> : null}
              </li>
            ))}
          </ul>
        )}
        <Pager pager={pager} />
      </Panel>
    </div>
  );
}
