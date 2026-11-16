import { useState } from "react";
import { Pencil, Plus, Store } from "lucide-react";
import { apiMessage } from "@/lib/api";
import { useSiteContent, type Shop } from "@/lib/site-content";
import { pushHash } from "./nav";
import { Badge, Button, DemoNote, Drawer, Empty, Field, IconButton, num, PageHead, Pager, Panel, rowOpen, usePager } from "./ui";

/** Shops that list products on the platform: list, add and rename. No delete yet, and no seller accounts. */
export function Shops() {
  const { content, catalogue, shops, addShop, renameShop } = useSiteContent();
  const [editing, setEditing] = useState<Shop | "new" | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const saved = catalogue.source === "admin";
  const canEdit = !saved || catalogue.canEdit;
  const pager = usePager(shops);
  const countOf = (id: string) => content.products.filter((item) => item.shopId === id && !item.archived).length;

  // The products list, filtered to this shop (#products/shop-<id>).
  const openProducts = (shop: Shop) => pushHash("products", `shop-${shop.id}`);

  function open(target: Shop | "new") {
    setEditing(target);
    setName(target === "new" ? "" : target.name);
    setError("");
  }

  async function save() {
    const clean = name.trim();
    if (!clean || saving || !editing) return;
    setSaving(true);
    setError("");
    try {
      if (editing === "new") await addShop(clean);
      else await renameShop(editing.id, clean);
      setEditing(null);
    } catch (failure) {
      setError(apiMessage(failure));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="المحلات"
        lead="المحلات اللي تعرض منتجاتها في المنصة. تربط كل منتج بمحله من صفحة تعديل المنتج."
        actions={
          canEdit ? (
            <Button variant="primary" icon={Plus} onClick={() => open("new")}>
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
                {canEdit ? <IconButton icon={Pencil} label="تعديل الاسم" onClick={() => open(shop)} /> : null}
              </li>
            ))}
          </ul>
        )}
        <Pager pager={pager} />
      </Panel>

      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "إضافة محل" : "تعديل اسم المحل"}
        footer={
          <>
            <Button onClick={() => setEditing(null)}>إلغاء</Button>
            <Button variant="primary" onClick={save} disabled={!name.trim() || saving}>
              {saving ? "جاري الحفظ…" : "حفظ"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="اسم المحل" value={name} onChange={setName} />
          {error ? (
            <p role="alert" className="text-sm text-(--a-danger)">
              {error}
            </p>
          ) : null}
        </div>
      </Drawer>
    </div>
  );
}
