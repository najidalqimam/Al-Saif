import { useEffect, useState } from "react";
import { ArchiveRestore, Pencil, Plus, Store } from "lucide-react";
import { TrashIcon } from "@/components/TrashIcon";
import { cn } from "@/lib/utils";
import { useSiteContent, type Shop } from "@/lib/site-content";
import { onHashMove, pushHash, readHash } from "./nav";
import { Products } from "./Products";
import { ShopFormPage } from "./ShopForm";
import { Badge, Button, Confirm, DemoNote, Empty, IconButton, num, PageHead, Pager, Panel, rowOpen, Switch, Tabs, usePager } from "./ui";

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
  const { content, catalogue, shops: allShops, reviewShop, setShopState } = useSiteContent();
  const [tab, setTab] = useState<"active" | "paused" | "archived">("active");
  const [deleting, setDeleting] = useState<Shop | null>(null);
  const [error, setError] = useState("");
  const counts = { active: allShops.filter((shop) => !shop.archived).length, paused: allShops.filter((shop) => !shop.archived && shop.isActive === false).length, archived: allShops.filter((shop) => shop.archived).length };
  const shops = allShops.filter((shop) => (tab === "archived" ? shop.archived : !shop.archived && (tab === "active" || shop.isActive === false)));
  const change = (shop: Shop, state: Parameters<typeof setShopState>[1]) => {
    setError("");
    setShopState(shop.id, state).catch(() => setError("ما قدرنا نحفظ التغيير. حاول مرة ثانية."));
  };
  const saved = catalogue.source === "admin";
  const canEdit = !saved || catalogue.canEdit;
  const pager = usePager(shops);
  const countOf = (id: string) => content.products.filter((item) => item.shopId === id && !item.archived).length;

  // The shop's own page (#shops/<id>): its details and products, without leaving the shops section.
  // A shop that just signed up carries a "new" mark until the admin opens it.
  const seen = (shop: Shop) => {
    if (shop.status === "PENDING") void reviewShop(shop.id, { approve: true }).catch(() => {});
  };
  const openProducts = (shop: Shop) => {
    seen(shop);
    pushHash("shops", shop.id);
  };

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
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          ["active", "المحلات", counts.active],
          ["paused", "موقوفة", counts.paused],
          ["archived", "الأرشيف", counts.archived],
        ]}
      />
      {error ? <p role="alert" className="text-sm text-(--a-danger)">{error}</p> : null}
      <Panel>
        {shops.length === 0 ? (
          <Empty icon={Store} title={tab === "active" ? "ما فيه محلات بعد" : "ما فيه محلات هنا"} lead={tab === "active" ? "أضف أول محل، وبعدها اربط منتجاتك به من تعديل المنتج." : tab === "archived" ? "المحلات المحذوفة تنتقل هنا وتقدر تسترجعها." : "المحل الموقوف يختفي من الموقع مع منتجاته، وتقدر تشغّله في أي وقت."} />
        ) : (
          <ul className="divide-y divide-(--a-line)">
            {pager.rows.map((shop) => (
              <li key={shop.id} {...rowOpen(() => openProducts(shop))} className={cn("flex cursor-pointer items-center gap-3 px-5 py-3.5", shop.status === "PENDING" && "bg-[#2563eb]/10")}>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--a-surface-2) text-(--a-muted)">
                  <Store className="size-5" />
                </span>
                <button type="button" onClick={() => openProducts(shop)} className="min-w-0 flex-1 cursor-pointer truncate text-start font-medium hover:underline" title="عرض منتجات المحل">
                  {shop.name}
                </button>
                {shop.status === "PENDING" ? <Badge tone="blue">جديد</Badge> : null}
                <button type="button" onClick={() => openProducts(shop)} aria-label={`عرض منتجات ${shop.name}`} title="عرض منتجات المحل" className="cursor-pointer rounded-full transition hover:opacity-80">
                  <Badge>{num.format(countOf(shop.id))} منتج</Badge>
                </button>
                {shop.isActive === false && !shop.archived ? <Badge tone="warn">موقوف</Badge> : null}
                {canEdit ? (
                  shop.archived ? (
                    <Button icon={ArchiveRestore} onClick={() => change(shop, { archived: false })}>
                      استرجاع
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Switch size="sm" checked={shop.isActive !== false} label={`إظهار ${shop.name} في المتجر`} onChange={(next) => change(shop, { isActive: next })} />
                      <span className="w-2" />
                      <IconButton icon={Pencil} label={`تعديل ${shop.name}`} onClick={() => { seen(shop); pushHash("shops", `${shop.id}/edit`); }} />
                      <IconButton icon={TrashIcon} label={`حذف ${shop.name}`} tone="danger" onClick={() => setDeleting(shop)} />
                    </div>
                  )
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <Pager pager={pager} />
      </Panel>

      <Confirm
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && change(deleting, { archived: true })}
        title={`حذف ${deleting?.name ?? ""}؟`}
        lead="المحل ومنتجاته يختفون من الموقع، ولا يقدر صاحب المحل يدخل لوحته. ينتقل المحل لتبويب الأرشيف وبياناته تبقى محفوظة وتقدر تسترجعه في أي وقت."
        action="نقل للأرشيف"
      />
    </div>
  );
}
