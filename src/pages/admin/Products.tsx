import { useEffect, useState } from "react";
import { Archive, ArchiveRestore, ChevronDown, ExternalLink, ImagePlus, PackageSearch, Pencil, Plus, Trash2, X } from "lucide-react";
import { ProductArt } from "@/components/site/card-art";
import { categoryById, categoryTrail } from "@/lib/catalog";
import { apiMessage } from "@/lib/api";
import { offerDetail } from "@/lib/offer-details";
import { useSiteContent, type NewProduct, type ProductRow, type ProductSpec, type Shop } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { validWholesale } from "@/lib/wholesale";
import { departmentTree, productCategoryOf, productInCategory } from "@/lib/product-categories";
import { onHashMove, pushHash, readHash, replaceHash } from "./nav";
import { Badge, BilingualField, Button, Confirm, control, Drawer, Empty, Field, IconButton, num, PageHead, Pager, Panel, rowOpen, sar, SearchBox, Select, Switch, Tabs, usePager } from "./ui";

type Filter = "all" | "live" | "hidden" | "archived";

export function Products() {
  const { content, updateProduct, shops, catalogue } = useSiteContent();
  const connected = catalogue.source === "admin";
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  // The departments page links here as #products/<category>, optionally with /add or /edit-<id>.
  // The shops page links as #products/shop-<shopId>: the same list, filtered to that shop's products.
  const [link] = useState(() => {
    const [linked = "", action = ""] = (readHash().view === "products" ? (readHash().sub ?? "") : "").split("/");
    const shop = linked.startsWith("shop-") ? linked.slice(5) : null;
    return { category: !shop && linked && categoryById(linked) ? linked : "all", shopId: shop, action };
  });
  const [category, setCategory] = useState(link.category);
  const [shopId, setShopId] = useState<string | null>(link.shopId);
  const shop = shopId ? shops.find((item) => item.id === shopId) : undefined;
  // What the hash carries for the current filter, so editing a product and coming back keeps the shop or department.
  const scope = shopId ? `shop-${shopId}` : category;
  const [editing, setEditing] = useState<string | null>(link.action.startsWith("edit-") ? link.action.slice(5) : null);
  // Editing a product is its own page (#products/<category>/edit-<id>), so the back gesture returns to the list.
  useEffect(
    () =>
      onHashMove(() => {
        const { view, sub } = readHash();
        if (view !== "products") return;
        const [linked = "", action = ""] = (sub ?? "").split("/");
        setEditing(action.startsWith("edit-") ? action.slice(5) : null);
        // Back and forward also restore or drop the shop filter.
        setShopId(linked.startsWith("shop-") ? linked.slice(5) : null);
      }),
    [],
  );
  const openEditor = (id: string) => {
    setEditing(id);
    pushHash("products", `${scope}/edit-${id}`);
    window.scrollTo(0, 0);
  };
  const [adding, setAdding] = useState(link.action === "add");
  const [archiving, setArchiving] = useState<ProductRow | null>(null);

  const inCategory = (item: ProductRow) => (!shopId || item.shopId === shopId) && (category === "all" || productInCategory(item, category));
  const products = content.products.filter(inCategory);
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
  const current = content.products.find((item) => item.id === editing) ?? null;

  const pager = usePager(rows, `${filter}|${query}|${category}|${shopId ?? ""}`);

  if (current) return <ProductEditor product={current} />;

  return (
    <div className="space-y-6">
      <PageHead
        title="المنتجات"
        lead="الأسعار والأسماء والظهور في المتجر، والتعديل يظهر على الموقع مباشرة."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>
            إضافة منتج
          </Button>
        }
      />

      {shopId ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <button
            type="button"
            onClick={() => {
              setShopId(null);
              pushHash("products", category === "all" ? null : category);
            }}
            className="text-sm text-(--a-blue) hover:underline"
          >
            عرض كل المنتجات
          </button>
          <span className="text-xs text-(--a-muted)">{num.format(rows.length)} منتج</span>
        </div>
      ) : null}

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
        <CategoryFilter products={content.products} hidden={content.categoryHidden} added={content.addedCategories.map((item) => item.id)} value={category} onChange={setCategory} />
      </div>
      {category !== "all" ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-(--a-muted)">القسم:</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-(--a-blue)/40 bg-(--a-blue-soft) py-1 ps-3 pe-1 font-medium text-(--a-blue)">
            {categoryTrail(category)
              .map((item) => item.nameAr)
              .join(" › ")}
            <button type="button" onClick={() => setCategory("all")} aria-label="عرض كل الأقسام" className="grid size-6 place-items-center rounded-full hover:bg-(--a-blue-soft)">
              <X className="size-3.5" />
            </button>
          </span>
          <span className="text-xs text-(--a-muted)">{num.format(rows.length)} منتج</span>
        </div>
      ) : null}

      <Panel>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-xs text-(--a-muted)">
                  <th className="px-4 py-2 first:ps-5 last:pe-5 text-start font-medium">المنتج</th>
                  <th className="px-4 py-2 first:ps-5 last:pe-5 text-start font-medium">السعر</th>
                  <th className="px-4 py-2 first:ps-5 last:pe-5 text-start font-medium">سعر الجملة</th>
                  <th className="px-4 py-2 first:ps-5 last:pe-5 text-start font-medium">التقييم</th>
                  <th className="px-4 py-2 first:ps-5 last:pe-5 text-start font-medium">معروض</th>
                  <th className="px-4 py-2 first:ps-5 last:pe-5 text-start font-medium">عروض الرئيسية</th>
                  <th className="px-4 py-2 first:ps-5 last:pe-5 text-end font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {pager.rows.map((item) => {
                  const off = item.compareAt > item.price ? Math.round((1 - item.price / item.compareAt) * 100) : 0;
                  const open = item.archived ? null : rowOpen(() => openEditor(item.id));
                  return (
                    <tr key={item.id} {...open} className={`${open ? "cursor-pointer " : ""}border-t border-(--a-line) transition hover:bg-(--a-surface-2)/50`}>
                      <td className="px-4 py-2 first:ps-5 last:pe-5">
                        <div className="flex items-center gap-3">
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--a-surface-2)">
                            <ProductArt id={item.id} className="size-8" />
                          </span>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5">
                              <span className="line-clamp-1 font-medium">{item.nameAr}</span>
                              {item.source === "demo" ? <Badge tone="blue">تجريبي</Badge> : item.source === "added" ? <Badge tone="accent">مضاف</Badge> : null}
                            </p>
                            <p className="line-clamp-1 text-xs text-(--a-muted)">{item.categoryAr}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 first:ps-5 last:pe-5">
                        <p className="font-medium tabular-nums">{sar.format(item.price)}</p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          {item.compareAt > item.price ? <s className="text-xs text-(--a-muted) tabular-nums">{sar.format(item.compareAt)}</s> : null}
                          {off ? <Badge tone="accent">-{num.format(off)}٪</Badge> : null}
                        </div>
                      </td>
                      <td className="px-4 py-2 first:ps-5 last:pe-5 tabular-nums">
                        {item.wholesalePrice == null ? (
                          <span className="text-(--a-muted)">غير محدد</span>
                        ) : validWholesale(item) === null ? (
                          <span className="text-xs text-(--a-danger)" title="سعر الجملة المحفوظ ما عاد أقل من السعر الحالي، فلا يُطبَّق">
                            غير صالح ({num.format(item.wholesalePrice)})
                          </span>
                        ) : (
                          <span className="font-medium">
                            {sar.format(item.wholesalePrice)}
                            {item.shopId ? null : (
                              <span className="ms-1.5 align-middle" title="المنتج غير مربوط بمحل، فسعر الجملة لا يظهر للعملاء ولا يُطبَّق">
                                <Badge tone="warn">بدون محل</Badge>
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 first:ps-5 last:pe-5 tabular-nums text-(--a-muted)">
                        {item.rating > 0 ? `★ ${item.rating.toFixed(1)} · ${num.format(item.reviews)}` : "—"}
                      </td>
                      <td className="px-4 py-2 first:ps-5 last:pe-5">
                        <Switch size="sm" checked={!item.hidden} disabled={item.archived} label={`إظهار ${item.nameAr} في المتجر`} onChange={(next) => updateProduct(item.id, { hidden: !next })} />
                      </td>
                      <td className="px-4 py-2 first:ps-5 last:pe-5">
                        <Switch
                          size="sm"
                          checked={item.onHome}
                          disabled={item.archived || item.hidden}
                          label={`إظهار ${item.nameAr} في عروض الرئيسية`}
                          onChange={(next) => updateProduct(item.id, { onHome: next })}
                        />
                      </td>
                      <td className="px-4 py-2 first:ps-5 last:pe-5">
                        <div className="flex justify-end gap-1">
                          {item.archived ? (
                            <Button icon={ArchiveRestore} onClick={() => updateProduct(item.id, { archived: false })}>
                              استرجاع
                            </Button>
                          ) : (
                            <>
                              <IconButton icon={Pencil} label={`تعديل ${item.nameAr}`} onClick={() => openEditor(item.id)} />
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
          <Empty
            icon={PackageSearch}
            title={shopId ? "ما فيه منتجات لهذا المحل" : "ما فيه منتجات هنا"}
            lead={shopId && !needle ? `ما فيه منتجات مربوطة بـ«${shop?.name ?? "هذا المحل"}» بهذي الحالة. تربط أي منتج بالمحل من صفحة تعديل المنتج.` : category !== "all" && !needle ? "ما فيه منتجات بهذي الحالة في هذا القسم. غيّر التبويب أو اختر قسم ثاني." : filter === "archived" ? "المنتجات المحذوفة تنتقل للأرشيف وتقدر تسترجعها." : "جرّب كلمة بحث ثانية أو غيّر الفلتر."}
          />
        )}
        <Pager pager={pager} />
      </Panel>


      <AddProduct
        open={adding}
        onClose={() => {
          setAdding(false);
          // Drop the one-off /add or /edit from a link so a refresh doesn't reopen the form.
          if (link.action) replaceHash("products", scope === "all" ? null : scope);
        }}
        defaultCategory={category === "all" ? null : category}
        onAdded={() => {
          setFilter("all");
          setQuery("");
        }}
      />

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

/**
 * Optional wholesale price per piece, entered once per product. Only a positive number below the current selling price is
 * saved; an invalid entry is refused with a message beside the field and the saved value stays as it was. An empty field
 * clears it (it is never read as zero). Connected to the store's database the server saves and re-checks it; in the local
 * preview it stays in this browser only.
 */
function WholesaleField({ value, price, hasShop, connected, onChange }: { value: number | null | undefined; price: number; hasShop: boolean; connected: boolean; onChange: (value: number | null) => void }) {
  const [text, setText] = useState(value == null ? "" : String(value));
  const [error, setError] = useState("");
  // The saved value can stop being valid when the selling price changes afterwards.
  const stale = value != null && !(value > 0 && value < price);
  const note = error || (stale ? `سعر الجملة المحفوظ (${num.format(value)} ر.س) لم يعد أقل من سعر البيع الحالي، فلا يُطبَّق. عدّله أو امسحه.` : "");

  function change(raw: string) {
    setText(raw);
    if (raw.trim() === "") {
      setError("");
      onChange(null);
      return;
    }
    const next = Number(raw);
    if (!Number.isFinite(next) || next <= 0) {
      setError("اكتب رقمًا أكبر من صفر.");
      return;
    }
    if (next >= price) {
      setError(`سعر الجملة لازم يكون أقل من سعر البيع الحالي (${num.format(price)} ر.س).`);
      return;
    }
    setError("");
    onChange(next);
  }

  return (
    <div>
      <Field label="سعر الجملة للقطعة (ر.س)" type="number" dir="ltr" value={text} placeholder="غير محدد" onChange={change} />
      {note ? (
        <p role="alert" className="mt-1.5 text-xs text-(--a-danger)">
          {note}
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-(--a-muted)">
          اختياري. يُطبَّق من 5 قطع لنفس المنتج عند نفس المحل، للعميل المسجّل.{connected ? "" : " محفوظ في هذا المتصفح فقط (معاينة)."}
        </p>
      )}
      {value != null && !note && !hasShop ? (
        <p role="status" className="mt-1.5 text-xs text-(--a-warn)">
          المنتج غير مربوط بمحل، فسعر الجملة لا يظهر للعملاء ولا يُطبَّق. اربطه بمحل من حقل «المحل» ليشتغل.
        </p>
      ) : null}
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

/** Store departments in the same order as the storefront menu; subcategories that hold products or were added from the dashboard sit under their department. */
function CategoryFilter({
  products,
  hidden,
  added,
  value,
  onChange,
}: {
  products: ProductRow[];
  hidden: string[];
  added: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const count = (id: string) => products.filter((item) => !item.archived && productInCategory(item, id)).length;
  const shown = (id: string) => added.includes(id) || products.some((item) => productInCategory(item, id));
  const options = departmentTree(hidden).filter((item) => item.level === 1 || shown(item.id));
  const active = value !== "all" && categoryById(value) !== null;

  return (
    <label className="relative block w-full sm:w-64">
      <span className="sr-only">القسم</span>
      <select
        value={active ? value : "all"}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-10 w-full appearance-none rounded-xl border bg-(--a-surface) ps-3 pe-9 text-sm outline-none focus:border-(--a-accent)",
          active ? "border-(--a-blue) font-medium text-(--a-blue)" : "border-(--a-line)",
        )}
      >
        <option value="all">كل الأقسام ({num.format(products.filter((item) => !item.archived).length)})</option>
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {"\u00a0\u00a0\u00a0".repeat(item.level - 1)}
            {item.nameAr} ({num.format(count(item.id))})
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute inset-y-0 end-3 my-auto size-4 text-(--a-muted)" />
    </label>
  );
}

/** Reads an image file and shrinks it to at most 600px so it stays small enough to save in the browser. */
function ImagePicker({ label, onPick }: { label: string; onPick: (dataUrl: string) => void }) {
  const [error, setError] = useState("");

  function read(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("اختر ملف صورة (PNG أو JPG أو WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 600 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
        onPick(canvas.toDataURL("image/webp", 0.85));
      };
      image.onerror = () => setError("ما قدرنا نقرأ الصورة. جرّب ملف ثاني.");
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="text-center">
      <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-(--a-line) bg-(--a-surface) px-3 text-sm font-medium hover:bg-(--a-surface-2)">
        <ImagePlus className="size-4" />
        {label}
        <input type="file" accept="image/*" className="sr-only" onChange={(event) => read(event.target.files?.[0])} />
      </label>
      {error ? <p className="mt-2 text-xs text-(--a-danger)">{error}</p> : null}
    </div>
  );
}

const EMPTY_PRODUCT: NewProduct = { nameAr: "", nameEn: "", categoryAr: "", categoryEn: "", categoryId: undefined, shopId: null, price: 0, compareAt: 0, image: undefined, hidden: false, onHome: false };

/** New product form; the product is saved with the site content and shows in its department right away. */
function AddProduct({ open, onClose, onAdded, defaultCategory }: { open: boolean; onClose: () => void; onAdded: () => void; defaultCategory: string | null }) {
  const { content, addProduct, shops, catalogue } = useSiteContent();
  const connected = catalogue.source === "admin";
  const [form, setForm] = useState<NewProduct>(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (patch: Partial<NewProduct>) => setForm((current) => ({ ...current, ...patch }));
  const tree = departmentTree(content.categoryHidden);
  const ready = form.nameAr.trim() !== "" && form.nameEn.trim() !== "" && form.price > 0 && Boolean(form.categoryId);

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_PRODUCT, categoryId: defaultCategory ?? undefined, ...labelsFor(defaultCategory) });
      setError("");
    }
  }, [open, defaultCategory]);

  function labelsFor(id: string | null | undefined) {
    const found = id ? categoryById(id) : null;
    return found ? { categoryAr: found.nameAr, categoryEn: found.nameEn } : {};
  }

  async function save() {
    if (!ready || saving) return;
    setSaving(true);
    setError("");
    try {
      await addProduct({
        ...form,
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim(),
        compareAt: form.compareAt > form.price ? form.compareAt : form.price,
        // Only a still-valid wholesale price is kept (the server checks it again).
        wholesalePrice: validWholesale({ price: form.price, wholesalePrice: form.wholesalePrice }),
      });
      onAdded();
      onClose();
    } catch (failure) {
      setError(apiMessage(failure));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="إضافة منتج"
      lead="المنتج يظهر في قسمه في الموقع أول ما تحفظه."
      footer={
        <>
          <Button onClick={onClose}>إلغاء</Button>
          <Button variant="primary" icon={Plus} onClick={save} disabled={!ready || saving}>
            {saving ? "جاري الحفظ…" : "حفظ المنتج"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid place-items-center gap-3 rounded-2xl bg-(--a-surface-2) py-6">
          {form.image ? <img src={form.image} alt="" className="size-32 object-contain" /> : <span className="grid size-32 place-items-center rounded-2xl border border-dashed border-(--a-line) text-xs text-(--a-muted)">بدون صورة</span>}
          <ImagePicker label={form.image ? "تغيير الصورة" : "رفع صورة المنتج"} onPick={(image) => set({ image })} />
        </div>
        <BilingualField label="اسم المنتج" ar={form.nameAr} en={form.nameEn} onAr={(nameAr) => set({ nameAr })} onEn={(nameEn) => set({ nameEn })} />
        <Select
          label="القسم في المتجر"
          value={form.categoryId ?? ""}
          onChange={(categoryId) => set({ categoryId: categoryId || undefined, ...labelsFor(categoryId) })}
          options={[["", "اختر القسم"], ...tree.map((item): [string, string] => [item.id, `${"\u00a0\u00a0\u00a0".repeat(item.level - 1)}${item.nameAr}`])]}
        />
        <Select label="المحل" value={form.shopId ?? ""} onChange={(shopId) => set({ shopId: shopId || null })} options={shopOptions(shops)} />
        <BilingualField
          label="اسم القسم الظاهر على المنتج"
          ar={form.categoryAr}
          en={form.categoryEn}
          onAr={(categoryAr) => set({ categoryAr })}
          onEn={(categoryEn) => set({ categoryEn })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <PriceField label="السعر (ر.س)" value={form.price} onChange={(price) => set({ price })} />
          <WholesaleField key={open ? "open" : "closed"} value={form.wholesalePrice} price={form.price} hasShop={Boolean(form.shopId)} connected={connected} onChange={(wholesalePrice) => set({ wholesalePrice })} />
          <PriceField label="السعر قبل الخصم (ر.س، اختياري)" value={form.compareAt} onChange={(compareAt) => set({ compareAt })} />
        </div>
        <div className="space-y-3 rounded-xl border border-(--a-line) p-4">
          <ToggleRow label="معروض في المتجر" checked={!form.hidden} onChange={(next) => set({ hidden: !next })} />
          <ToggleRow label="في عروض الصفحة الرئيسية" checked={form.onHome} disabled={form.hidden} onChange={(onHome) => set({ onHome })} />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-(--a-danger)">
            {error}
          </p>
        ) : null}
        <p className="text-xs leading-6 text-(--a-muted)">المنتج يتحفظ في قاعدة بيانات المتجر. الحقول المطلوبة: الاسم بالعربي والإنجليزي، القسم، والسعر.</p>
      </div>
    </Drawer>
  );
}

type Lang = "ar" | "en";
const LANGS: Lang[] = ["ar", "en"];

/** Product page copy: description, highlights and the spec table, in both languages. */
function ProductPageFields({ product }: { product: ProductRow }) {
  const { updateProduct } = useSiteContent();
  // The lists are drafts kept here, so a half-typed row survives the server's answer; only complete rows are saved.
  const [features, setFeatures] = useState<Record<Lang, string[]>>(() => ({
    ar: product.featuresAr ?? offerDetail("ar", product.id)?.features ?? [],
    en: product.featuresEn ?? offerDetail("en", product.id)?.features ?? [],
  }));
  const [specs, setSpecs] = useState<Record<Lang, ProductSpec[]>>(() => ({
    ar: product.specsAr ?? offerDetail("ar", product.id)?.specs.map(([label, value]) => ({ label, value })) ?? [],
    en: product.specsEn ?? offerDetail("en", product.id)?.specs.map(([label, value]) => ({ label, value })) ?? [],
  }));

  function saveFeatures(lang: Lang, list: string[]) {
    setFeatures((current) => ({ ...current, [lang]: list }));
    const clean = list.map((item) => item.trim()).filter(Boolean);
    updateProduct(product.id, lang === "ar" ? { featuresAr: clean } : { featuresEn: clean });
  }

  function saveSpecs(lang: Lang, list: ProductSpec[]) {
    setSpecs((current) => ({ ...current, [lang]: list }));
    const clean = list.map((row) => ({ label: row.label.trim(), value: row.value.trim() })).filter((row) => row.label && row.value);
    updateProduct(product.id, lang === "ar" ? { specsAr: clean } : { specsEn: clean });
  }

  return (
    <div className="space-y-5">

      <BilingualField
        label="وصف المنتج (اختياري)"
        ar={product.descriptionAr ?? ""}
        en={product.descriptionEn ?? ""}
        onAr={(value) => updateProduct(product.id, { descriptionAr: value })}
        onEn={(value) => updateProduct(product.id, { descriptionEn: value })}
        multiline
      />

      <div>
        <p className="mb-2 text-xs font-medium text-(--a-muted)">أبرز التفاصيل</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {LANGS.map((lang) => (
            <div key={lang} dir={lang === "ar" ? "rtl" : "ltr"} className="space-y-2">
              <LangTag lang={lang} />
              {features[lang].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={item}
                    onChange={(event) => saveFeatures(lang, features[lang].map((old, at) => (at === index ? event.target.value : old)))}
                    placeholder={lang === "ar" ? "مثال: ضمان محلي لمدة سنتين" : "e.g. Two-year local warranty"}
                    className={cn(control, "h-10")}
                  />
                  <IconButton icon={Trash2} tone="danger" label="حذف السطر" onClick={() => saveFeatures(lang, features[lang].filter((_, at) => at !== index))} />
                </div>
              ))}
              <Button icon={Plus} onClick={() => setFeatures((current) => ({ ...current, [lang]: [...current[lang], ""] }))}>
                إضافة سطر
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-(--a-muted)">بيانات المنتج (جدول المواصفات)</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {LANGS.map((lang) => (
            <div key={lang} dir={lang === "ar" ? "rtl" : "ltr"} className="space-y-2">
              <LangTag lang={lang} />
              {specs[lang].map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={row.label}
                    onChange={(event) => saveSpecs(lang, specs[lang].map((old, at) => (at === index ? { ...old, label: event.target.value } : old)))}
                    placeholder={lang === "ar" ? "البند" : "Label"}
                    aria-label={lang === "ar" ? "البند" : "Label"}
                    className={cn(control, "h-10 w-2/5")}
                  />
                  <input
                    value={row.value}
                    onChange={(event) => saveSpecs(lang, specs[lang].map((old, at) => (at === index ? { ...old, value: event.target.value } : old)))}
                    placeholder={lang === "ar" ? "القيمة" : "Value"}
                    aria-label={lang === "ar" ? "القيمة" : "Value"}
                    className={cn(control, "h-10 flex-1")}
                  />
                  <IconButton icon={Trash2} tone="danger" label="حذف الصف" onClick={() => saveSpecs(lang, specs[lang].filter((_, at) => at !== index))} />
                </div>
              ))}
              <Button icon={Plus} onClick={() => setSpecs((current) => ({ ...current, [lang]: [...current[lang], { label: "", value: "" }] }))}>
                إضافة صف
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** "بدون محل" first; a linked shop missing from the list (not loaded yet) is kept so the choice is not lost. */
function shopOptions(shops: Shop[], linked?: string | null): Array<[string, string]> {
  const known = linked && !shops.some((shop) => shop.id === linked);
  return [["", "بدون محل"], ...(known ? ([[linked, "محل غير معروف"]] as Array<[string, string]>) : []), ...shops.map((shop): [string, string] => [shop.id, shop.name])];
}

function LangTag({ lang }: { lang: Lang }) {
  return (
    <span className={cn("inline-block rounded px-1.5 py-px text-[10px] font-semibold", lang === "en" ? "bg-(--a-blue-soft) text-(--a-blue)" : "bg-(--a-accent-soft) text-(--a-accent-ink)")}>
      {lang === "en" ? "EN" : "AR"}
    </span>
  );
}

/** Full-page product editor: basic details and visibility, the photo, and the product page copy. */
function ProductEditor({ product }: { product: ProductRow }) {
  const { content, updateProduct, shops, catalogue } = useSiteContent();
  const connected = catalogue.source === "admin";
  const update = (patch: Partial<ProductRow>) => updateProduct(product.id, patch);

  return (
    <div className="space-y-6">
      <PageHead
        title={`تعديل: ${product.nameAr}`}
        lead="التعديل يتحفظ تلقائيًا ويظهر على الموقع."
        actions={
          <a
            href={`/ar/p/${encodeURIComponent(product.id)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-(--a-line) bg-(--a-surface) px-4 text-sm font-medium hover:bg-(--a-surface-2)"
          >
            <ExternalLink className="size-4" />
            عرض صفحة المنتج
          </a>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <Panel title="البيانات الأساسية">
            <div className="space-y-5 p-5">
              <BilingualField label="اسم المنتج" ar={product.nameAr} en={product.nameEn} onAr={(nameAr) => update({ nameAr })} onEn={(nameEn) => update({ nameEn })} />
              <Select
                label="القسم في المتجر"
                value={productCategoryOf(product) ?? ""}
                onChange={(categoryId) => update({ categoryId })}
                options={[
                  ...(productCategoryOf(product) ? [] : ([["", "بدون قسم"]] as Array<[string, string]>)),
                  ...departmentTree(content.categoryHidden).map((item): [string, string] => [item.id, `${"\u00a0\u00a0\u00a0".repeat(item.level - 1)}${item.nameAr}`]),
                ]}
              />
              <Select label="المحل" value={product.shopId ?? ""} onChange={(shopId) => update({ shopId: shopId || null })} options={shopOptions(shops, product.shopId)} />
              <BilingualField
                label="اسم القسم الظاهر على المنتج"
                ar={product.categoryAr}
                en={product.categoryEn}
                onAr={(categoryAr) => update({ categoryAr })}
                onEn={(categoryEn) => update({ categoryEn })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <PriceField label="السعر (ر.س)" value={product.price} onChange={(price) => update({ price })} />
                <WholesaleField value={product.wholesalePrice} price={product.price} hasShop={Boolean(product.shopId)} connected={connected} onChange={(wholesalePrice) => update({ wholesalePrice })} />
                <PriceField label="السعر قبل الخصم (ر.س)" value={product.compareAt} onChange={(compareAt) => update({ compareAt })} />
              </div>
            </div>
          </Panel>

          <Panel title="صفحة المنتج" lead="اللي يظهر للعميل لما يفتح صفحة المنتج. الأسطر الفاضية ما تتحفظ.">
            <div className="p-5">
              <ProductPageFields key={product.id} product={product} />
            </div>
          </Panel>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <Panel title="الصورة">
            <div className="grid place-items-center gap-3 p-5">
              <div className="grid w-full place-items-center rounded-2xl bg-(--a-surface-2) py-6">
                <ProductArt id={product.id} className="size-40" />
              </div>
              <ImagePicker label={product.image || !product.source ? "تغيير الصورة" : "إضافة صورة"} onPick={(image) => update({ image })} />
              <p className="text-center text-xs leading-6 text-(--a-muted)">PNG أو JPG أو WebP. الصورة تتصغّر تلقائيًا، وأفضل تكون بخلفية بيضاء أو شفافة.</p>
            </div>
          </Panel>
          <Panel title="الظهور">
            <div className="space-y-3 p-5">
              <ToggleRow label="معروض في المتجر" checked={!product.hidden} onChange={(next) => update({ hidden: !next })} />
              <ToggleRow label="في عروض الصفحة الرئيسية" checked={product.onHome} disabled={product.hidden} onChange={(onHome) => update({ onHome })} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
