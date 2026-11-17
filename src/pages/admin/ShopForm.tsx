import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Save } from "lucide-react";
import { ProductArt } from "@/components/site/card-art";
import { apiMessage } from "@/lib/api";
import { useSiteContent, type ShopInput } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { pushHash, registerLeaveGuard } from "./nav";
import { Badge, Button, Empty, Field, PageHead, Pager, Panel, SearchBox, Tabs, num, sar, usePager } from "./ui";

const EMPTY: Required<ShopInput> = { name: "", ownerName: "", phone: "", email: "", city: "", address: "", description: "" };

/**
 * Add a shop (#shops/add) or edit one (#shops/<id>): its details, and under them its products. Ticking a product links
 * it to this shop; unticking frees it. Nothing is saved until Save.
 */
export function ShopFormPage({ id }: { id: string | null }) {
  const { shops, content, addShop, updateShop, saveProduct } = useSiteContent();
  const shop = id ? (shops.find((item) => item.id === id) ?? null) : null;
  const products = useMemo(() => content.products.filter((item) => !item.archived), [content.products]);
  const initial = useMemo(() => ({ ...EMPTY, ...(shop ?? {}) } as Required<ShopInput>), [shop]);
  const initialLinked = useMemo(() => products.filter((item) => id && item.shopId === id).map((item) => item.id), [products, id]);

  const [form, setForm] = useState<Required<ShopInput>>(initial);
  const [linked, setLinked] = useState<string[]>(initialLinked);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"linked" | "all">(id ? "linked" : "all");
  const [query, setQuery] = useState("");
  const set = (patch: Partial<ShopInput>) => setForm((current) => ({ ...current, ...patch }));
  const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((value) => b.includes(value));
  const dirty = JSON.stringify(form) !== JSON.stringify(initial) || !sameSet(linked, initialLinked);
  const ready = form.name.trim() !== "";
  const unsaved = useRef(false);
  unsaved.current = dirty;

  // Leaving with unsaved input asks first; the prompt can save the shop (it only leaves when the save worked).
  const saveRef = useRef<(leave: boolean) => Promise<boolean>>(async () => true);
  useEffect(() => registerLeaveGuard(() => unsaved.current, { save: () => saveRef.current(false), anySub: true }), []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function save(leave = true): Promise<boolean> {
    if (saving) return false;
    if (!ready) {
      setError("اسم المحل مطلوب قبل الحفظ.");
      return false;
    }
    setSaving(true);
    setError("");
    try {
      const details: ShopInput = { name: form.name.trim(), ownerName: form.ownerName.trim(), phone: form.phone.trim(), email: form.email.trim(), city: form.city.trim(), address: form.address.trim(), description: form.description.trim() };
      let shopId = id;
      if (shopId) await updateShop(shopId, details);
      else shopId = await addShop(details);
      // Products that joined or left this shop, one at a time so a refusal names the product.
      for (const productId of linked.filter((value) => !initialLinked.includes(value))) await saveProduct(productId, { shopId });
      for (const productId of initialLinked.filter((value) => !linked.includes(value))) await saveProduct(productId, { shopId: null });
      // Saved: nothing is left to lose, so the leave prompt must not ask again.
      unsaved.current = false;
      if (leave) pushHash("shops", id ? id : shopId);
      return true;
    } catch (failure) {
      setError(apiMessage(failure));
      return false;
    } finally {
      setSaving(false);
    }
  }
  saveRef.current = save;

  const needle = query.trim().toLowerCase();
  const rows = products.filter((item) => {
    if (tab === "linked" && !linked.includes(item.id)) return false;
    return !needle || [item.nameAr, item.nameEn, item.categoryAr].some((text) => text.toLowerCase().includes(needle));
  });
  const pager = usePager(rows, `${tab}|${query}`);
  const toggle = (productId: string) => setLinked((current) => (current.includes(productId) ? current.filter((value) => value !== productId) : [...current, productId]));
  const shopName = (shopId: string | null | undefined) => (shopId ? shops.find((item) => item.id === shopId)?.name : undefined);

  if (id && !shop) {
    return (
      <div className="space-y-6">
        <PageHead title="المحل" />
        <Panel>
          <Empty icon={Check} title="ما لقينا هذا المحل" lead="يمكن الرابط غلط أو المحل ما اتحمّل بعد. ارجع لقايمة المحلات." />
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead
        title={id ? `تعديل: ${shop?.name ?? ""}` : "إضافة محل"}
        lead={dirty ? "فيه تعديلات غير محفوظة. اضغط حفظ عشان تتسجل." : id ? "بيانات المحل ومنتجاته." : "أدخل بيانات المحل، واختر منتجاته من تحت."}
        actions={
          <Button variant="primary" icon={Save} onClick={() => void save()} disabled={!ready || saving || (!!id && !dirty)}>
            {saving ? "جاري الحفظ…" : "حفظ المحل"}
          </Button>
        }
      />

      {error ? (
        <p role="alert" className="rounded-xl border border-(--a-danger)/30 px-4 py-3 text-sm text-(--a-danger)">
          {error}
        </p>
      ) : null}

      <Panel title="بيانات المحل">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="اسم المحل (مطلوب)" value={form.name} onChange={(name) => set({ name })} />
          <Field label="اسم المسؤول" value={form.ownerName} onChange={(ownerName) => set({ ownerName })} />
          <Field label="الجوال" value={form.phone} onChange={(phone) => set({ phone })} dir="ltr" />
          <Field label="البريد الإلكتروني" value={form.email} onChange={(email) => set({ email })} type="email" dir="ltr" />
          <Field label="المدينة" value={form.city} onChange={(city) => set({ city })} />
          <Field label="العنوان" value={form.address} onChange={(address) => set({ address })} />
          <div className="sm:col-span-2">
            <Field label="نبذة عن المحل" value={form.description} onChange={(description) => set({ description })} multiline />
          </div>
        </div>
      </Panel>

      <Panel title="منتجات المحل" lead="علّم على المنتجات اللي تتبع هذا المحل. منتج تابع لمحل ثاني لو علّمته ينتقل لهذا المحل.">
        <div className="flex flex-wrap items-center gap-3 border-b border-(--a-line) p-4">
          <Tabs value={tab} onChange={setTab} items={[["linked", "منتجات المحل", linked.length], ["all", "كل المنتجات", products.length]]} />
          <SearchBox value={query} onChange={setQuery} placeholder="ابحث باسم المنتج أو القسم" />
        </div>
        {rows.length ? (
          <ul className="divide-y divide-(--a-line)">
            {pager.rows.map((item) => {
              const checked = linked.includes(item.id);
              const other = !checked && item.shopId && item.shopId !== id ? shopName(item.shopId) : undefined;
              return (
                <li key={item.id}>
                  <label className={cn("flex cursor-pointer flex-wrap items-center gap-4 px-5 py-2.5 transition hover:bg-(--a-surface-2)/50", checked && "bg-(--a-blue-soft)/30")}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(item.id)} className="size-4 accent-(--a-accent)" aria-label={`ربط ${item.nameAr} بالمحل`} />
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--a-surface-2)">
                      <ProductArt id={item.id} className="size-8" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block line-clamp-1 font-medium">{item.nameAr}</span>
                      <span className="mt-0.5 block text-xs text-(--a-muted)">{item.categoryAr}</span>
                    </span>
                    {other ? <Badge tone="warn">تابع لـ {other}</Badge> : null}
                    <span className="font-semibold tabular-nums">{sar.format(item.price)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty
            icon={Check}
            title={tab === "linked" ? "ما فيه منتجات مربوطة" : "ما فيه نتائج"}
            lead={tab === "linked" ? "افتح «كل المنتجات» وعلّم على المنتجات اللي تتبع هذا المحل." : "جرّب كلمة بحث ثانية."}
          />
        )}
        <Pager pager={pager} />
        <p className="border-t border-(--a-line) px-5 py-3 text-xs text-(--a-muted)">{num.format(linked.length)} منتج مختار. الربط يتحفظ عند الضغط على «حفظ المحل».</p>
      </Panel>
    </div>
  );
}
