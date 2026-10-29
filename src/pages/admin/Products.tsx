import { useState } from "react";
import { Archive, ArchiveRestore, PackageSearch, Pencil, Plus } from "lucide-react";
import { ProductArt } from "@/components/site/card-art";
import { useSiteContent, type ProductRow } from "@/lib/site-content";
import { Badge, BilingualField, Button, Confirm, Drawer, Empty, Field, IconButton, PageHead, Panel, PendingNote, SearchBox, Switch, Tabs, num, sar } from "./ui";

type Filter = "all" | "live" | "hidden" | "archived";

export function Products() {
  const { content, updateProduct } = useSiteContent();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [archiving, setArchiving] = useState<ProductRow | null>(null);

  const products = content.products;
  const counts = {
    all: products.filter((item) => !item.archived).length,
    live: products.filter((item) => !item.archived && !item.hidden).length,
    hidden: products.filter((item) => !item.archived && item.hidden).length,
    archived: products.filter((item) => item.archived).length,
  };
  const needle = query.trim().toLowerCase();
  const rows = products.filter((item) => {
    if (filter === "archived" ? !item.archived : item.archived) return false;
    if (filter === "live" && item.hidden) return false;
    if (filter === "hidden" && !item.hidden) return false;
    if (needle && ![item.nameAr, item.nameEn, item.categoryAr, item.categoryEn, item.id].some((text) => text.toLowerCase().includes(needle))) return false;
    return true;
  });
  const current = products.find((item) => item.id === editing) ?? null;

  return (
    <div className="space-y-6">
      <PageHead
        title="المنتجات"
        lead="الأسعار والأسماء والظهور في المتجر. أي تعديل يتحفظ مباشرة ويظهر على الموقع."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>
            إضافة منتج
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={filter}
          onChange={setFilter}
          items={[
            ["all", "الكل", counts.all],
            ["live", "معروض", counts.live],
            ["hidden", "مخفي", counts.hidden],
            ["archived", "الأرشيف", counts.archived],
          ]}
        />
        <SearchBox value={query} onChange={setQuery} placeholder="ابحث باسم المنتج أو القسم" />
      </div>

      <Panel>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-xs text-(--a-muted)">
                  <th className="px-5 py-3 text-start font-medium">المنتج</th>
                  <th className="px-5 py-3 text-start font-medium">السعر</th>
                  <th className="px-5 py-3 text-start font-medium">التقييم</th>
                  <th className="px-5 py-3 text-start font-medium">معروض</th>
                  <th className="px-5 py-3 text-start font-medium">عروض الرئيسية</th>
                  <th className="px-5 py-3 text-end font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => {
                  const off = item.compareAt > item.price ? Math.round((1 - item.price / item.compareAt) * 100) : 0;
                  return (
                    <tr key={item.id} className="border-t border-(--a-line) transition hover:bg-(--a-surface-2)/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-(--a-surface-2)">
                            <ProductArt id={item.id} className="size-10" />
                          </span>
                          <div className="min-w-0">
                            <p className="line-clamp-1 font-medium">{item.nameAr}</p>
                            <p className="line-clamp-1 text-xs text-(--a-muted)">{item.categoryAr}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium tabular-nums">{sar.format(item.price)}</p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          {item.compareAt > item.price ? <s className="text-xs text-(--a-muted) tabular-nums">{sar.format(item.compareAt)}</s> : null}
                          {off ? <Badge tone="accent">-{num.format(off)}٪</Badge> : null}
                        </div>
                      </td>
                      <td className="px-5 py-3 tabular-nums text-(--a-muted)">
                        ★ {item.rating.toLocaleString("ar-SA")} · {num.format(item.reviews)}
                      </td>
                      <td className="px-5 py-3">
                        <Switch checked={!item.hidden} disabled={item.archived} label={`إظهار ${item.nameAr} في المتجر`} onChange={(next) => updateProduct(item.id, { hidden: !next })} />
                      </td>
                      <td className="px-5 py-3">
                        <Switch
                          checked={item.onHome}
                          disabled={item.archived || item.hidden}
                          label={`إظهار ${item.nameAr} في عروض الرئيسية`}
                          onChange={(next) => updateProduct(item.id, { onHome: next })}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          {item.archived ? (
                            <Button icon={ArchiveRestore} onClick={() => updateProduct(item.id, { archived: false })}>
                              استرجاع
                            </Button>
                          ) : (
                            <>
                              <IconButton icon={Pencil} label={`تعديل ${item.nameAr}`} onClick={() => setEditing(item.id)} />
                              <IconButton icon={Archive} label={`حذف ${item.nameAr}`} tone="danger" onClick={() => setArchiving(item)} />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon={PackageSearch} title="ما فيه منتجات هنا" lead={filter === "archived" ? "المنتجات المحذوفة تنتقل للأرشيف وتقدر تسترجعها." : "جرّب كلمة بحث ثانية أو غيّر الفلتر."} />
        )}
      </Panel>

      <Drawer
        open={current !== null}
        onClose={() => setEditing(null)}
        title={current ? `تعديل: ${current.nameAr}` : ""}
        lead="التعديل يتحفظ تلقائيًا ويظهر على الموقع."
        footer={<Button variant="primary" onClick={() => setEditing(null)}>تم</Button>}
      >
        {current ? (
          <div className="space-y-5">
            <div className="grid place-items-center rounded-2xl bg-(--a-surface-2) py-6">
              <ProductArt id={current.id} className="size-32" />
            </div>
            <BilingualField
              label="اسم المنتج"
              ar={current.nameAr}
              en={current.nameEn}
              onAr={(value) => updateProduct(current.id, { nameAr: value })}
              onEn={(value) => updateProduct(current.id, { nameEn: value })}
            />
            <BilingualField
              label="القسم"
              ar={current.categoryAr}
              en={current.categoryEn}
              onAr={(value) => updateProduct(current.id, { categoryAr: value })}
              onEn={(value) => updateProduct(current.id, { categoryEn: value })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <PriceField label="السعر (ر.س)" value={current.price} onChange={(value) => updateProduct(current.id, { price: value })} />
              <PriceField label="السعر قبل الخصم (ر.س)" value={current.compareAt} onChange={(value) => updateProduct(current.id, { compareAt: value })} />
            </div>
            <div className="space-y-3 rounded-xl border border-(--a-line) p-4">
              <ToggleRow label="معروض في المتجر" checked={!current.hidden} onChange={(next) => updateProduct(current.id, { hidden: !next })} />
              <ToggleRow label="في عروض الصفحة الرئيسية" checked={current.onHome} disabled={current.hidden} onChange={(next) => updateProduct(current.id, { onHome: next })} />
            </div>
          </div>
        ) : null}
      </Drawer>

      <Drawer
        open={adding}
        onClose={() => setAdding(false)}
        title="إضافة منتج"
        footer={
          <>
            <Button onClick={() => setAdding(false)}>إلغاء</Button>
            <Button variant="primary" disabled>
              حفظ المنتج
            </Button>
          </>
        }
      >
        <PendingNote />
        <div className="space-y-5">
          <BilingualField label="اسم المنتج" ar="" en="" onAr={() => {}} onEn={() => {}} disabled />
          <BilingualField label="القسم" ar="" en="" onAr={() => {}} onEn={() => {}} disabled />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="السعر (ر.س)" value="" onChange={() => {}} disabled />
            <Field label="السعر قبل الخصم (ر.س)" value="" onChange={() => {}} disabled />
          </div>
          <Field label="صورة المنتج" value="" onChange={() => {}} placeholder="رفع الصورة إلى Supabase Storage" disabled />
        </div>
      </Drawer>

      <Confirm
        open={archiving !== null}
        onClose={() => setArchiving(null)}
        onConfirm={() => archiving && updateProduct(archiving.id, { archived: true })}
        title={`حذف ${archiving?.nameAr ?? ""}؟`}
        lead="المنتج يختفي من المتجر وينتقل للأرشيف. بياناته تبقى محفوظة وتقدر تسترجعه في أي وقت."
        action="نقل للأرشيف"
      />
    </div>
  );
}

function PriceField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <Field
      label={label}
      type="number"
      dir="ltr"
      value={String(value)}
      onChange={(raw) => {
        const next = Number(raw);
        if (Number.isFinite(next) && next >= 0) onChange(next);
      }}
    />
  );
}

export function ToggleRow({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (next: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onChange={onChange} label={label} disabled={disabled} />
    </div>
  );
}
