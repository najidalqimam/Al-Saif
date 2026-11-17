import { useEffect, useMemo, useRef, useState } from "react";
import { Archive, ArchiveRestore, Check, ChevronDown, ExternalLink, ImagePlus, PackageSearch, Pencil, Plus, Save, Send, Trash2, X } from "lucide-react";
import { ProductArt } from "@/components/site/card-art";
import { categoryById, categoryTrail, departmentOf } from "@/lib/catalog";
import { apiMessage } from "@/lib/api";
import { offerDetail } from "@/lib/offer-details";
import { useSiteContent, type NewProduct, type ProductRow, type ProductSpec, type Shop, type PageCopyKey } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { validWholesale } from "@/lib/wholesale";
import { departmentTree, productCategoryOf, productInCategory } from "@/lib/product-categories";
import { onHashMove, pushHash, readHash, registerLeaveGuard } from "./nav";
import { Badge, Button, Confirm, control, Empty, Field, IconButton, num, PageHead, Pager, Panel, rowOpen, sar, SearchBox, SearchSelect, Select, Switch, usePager, BilingualField} from "./ui";

type Filter = "all" | "live" | "hidden" | "archived";

/** The products list. `shopScope` (a shop id) shows the list inside the shops section: that shop's products, titled with its name. */
export function Products({ shopScope }: { shopScope?: string } = {}) {
  const { content, updateProduct, shops } = useSiteContent();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  // The departments page links here as #products/<category>, optionally with /add or /edit-<id>.
  // The shops page links as #products/shop-<shopId>: the same list, filtered to that shop's products.
  const [link] = useState(() => {
    const [linked = "", action = ""] = (readHash().view === "products" ? (readHash().sub ?? "") : "").split("/");
    const shop = linked.startsWith("shop-") ? linked.slice(5) : null;
    return { category: !shop && linked && categoryById(linked) ? linked : "all", shopId: shopScope ?? shop, action: shopScope ? "" : action };
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
        setAdding(action === "add");
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
  // Adding a product is its own page too (#products/<category>/add).
  const [adding, setAdding] = useState(link.action === "add");
  const openAdd = () => {
    setAdding(true);
    pushHash("products", `${scope}/add`);
    window.scrollTo(0, 0);
  };
  const closeAdd = () => {
    setAdding(false);
    pushHash("products", scope === "all" ? null : scope);
  };
  const [archiving, setArchiving] = useState<ProductRow | null>(null);

  const inCategory = (item: ProductRow) => (!shopId || item.shopId === shopId) && (category === "all" || productInCategory(item, category));
  // A product a shop sent and the admin has not approved yet lives in the requests page, not in this list.
  const products = content.products.filter((item) => !item.approval && inCategory(item));
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
  if (adding) {
    return (
      <AddProductPage
        defaultCategory={category === "all" ? null : category}
        defaultShopId={shopId}
        onClose={closeAdd}
        onAdded={() => {
          setFilter("all");
          setQuery("");
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHead
        title={shopScope ? `منتجات ${shop?.name ?? ""}` : "المنتجات"}
        lead={shopScope ? "المنتجات اللي تتبع هذا المحل. الأسعار والظهور والتعديل يظهر على الموقع مباشرة." : "الأسعار والأسماء والظهور في المتجر، والتعديل يظهر على الموقع مباشرة."}
        actions={
          <Button variant="primary" icon={Plus} onClick={openAdd}>
            إضافة منتج
          </Button>
        }
      />

      {shopId && !shopScope ? (
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

      {shop ? (
        <Panel
          title={shop.name}
          lead="بيانات المحل"
          actions={
            <Button icon={Pencil} onClick={() => pushHash("shops", `${shop.id}/edit`)}>
              تعديل المحل
            </Button>
          }
        >
          <dl className="grid gap-x-6 gap-y-4 p-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["اسم المسؤول", shop.ownerName, undefined],
                ["الجوال", shop.phone, "ltr"],
                ["البريد الإلكتروني", shop.email, "ltr"],
                ["المدينة", shop.city, undefined],
                ["العنوان", shop.address, undefined],
              ] as Array<[string, string | undefined, "ltr" | undefined]>
            ).map(([label, value, dir]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs text-(--a-muted)">{label}</dt>
                <dd dir={dir} className={cn("mt-0.5 truncate font-medium", dir && "text-end", !value?.trim() && "font-normal text-(--a-muted)")}>
                  {value?.trim() || "—"}
                </dd>
              </div>
            ))}
            <div className="min-w-0">
              <dt className="text-xs text-(--a-muted)">عدد المنتجات</dt>
              <dd className="mt-0.5 font-medium tabular-nums">{num.format(content.products.filter((item) => item.shopId === shop.id && !item.archived).length)}</dd>
            </div>
            {shop.description?.trim() ? (
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-xs text-(--a-muted)">نبذة عن المحل</dt>
                <dd className="mt-0.5 leading-7">{shop.description}</dd>
              </div>
            ) : null}
          </dl>
        </Panel>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={query} onChange={setQuery} placeholder="ابحث باسم المنتج أو القسم" />
        <CategoryFilter products={content.products} hidden={content.categoryHidden} value={category} onChange={setCategory} />
        <div className="w-full sm:w-48">
          <Select<Filter>
            label="الحالة"
            hideLabel
            value={filter}
            onChange={setFilter}
            options={[
              ["all", `الكل (${num.format(counts.all)})`],
              ["live", `معروض (${num.format(counts.live)})`],
              ["hidden", `مخفي (${num.format(counts.hidden)})`],
              ["archived", `الأرشيف (${num.format(counts.archived)})`],
            ]}
          />
        </div>
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

export function PriceField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
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

/** The main store departments, in the same order as the storefront menu. */
function CategoryFilter({
  products,
  hidden,
  value,
  onChange,
}: {
  products: ProductRow[];
  hidden: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const count = (id: string) => products.filter((item) => !item.archived && productInCategory(item, id)).length;
  // Main departments only (the store has no subcategories). A category opened from an old link stays listed while selected.
  const options = departmentTree(hidden).filter((item) => item.level === 1 || item.id === value);
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
export function ImagePicker({ label, onPick }: { label: string; onPick: (dataUrl: string) => void }) {
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

const EMPTY_PRODUCT: NewProduct = { nameAr: "", nameEn: "", nameUr: "", categoryAr: "", categoryEn: "", categoryUr: "", categoryId: undefined, shopId: null, price: 0, compareAt: 0, image: undefined, hidden: false, onHome: false };

/** New product page (#products/<category>/add); the product is saved with the site content and shows in its department right away. */
/** How the shop dashboard uses the add-product page: it sends the product to the admin for approval, and asks before leaving with unsaved input. */
export type ShopMode = {
  submit: (product: NewProduct) => Promise<unknown>;
  /** Registers "has unsaved input" and "send it" with the shop dashboard's own navigation; returns the cleanup. */
  registerGuard: (hasUnsaved: () => boolean, save: () => Promise<boolean>) => () => void;
};

export function AddProductPage({ onClose, onAdded, defaultCategory, defaultShopId, shopMode }: { onClose: () => void; onAdded: () => void; defaultCategory: string | null; defaultShopId: string | null; shopMode?: ShopMode }) {
  const { content, addProduct, shops, catalogue } = useSiteContent();
  const connected = catalogue.source === "admin";
  const labelsFor = (id: string | null | undefined) => {
    const found = id ? categoryById(id) : null;
    return found ? { categoryAr: found.nameAr, categoryEn: found.nameEn } : {};
  };
  const initial = useMemo<NewProduct>(() => ({ ...EMPTY_PRODUCT, categoryId: defaultCategory ?? undefined, shopId: defaultShopId, hidden: shopMode ? true : EMPTY_PRODUCT.hidden, ...labelsFor(defaultCategory) }), [defaultCategory, defaultShopId, shopMode]);
  const [form, setForm] = useState<NewProduct>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (patch: Partial<NewProduct>) => setForm((current) => ({ ...current, ...patch }));
  const tree = departmentTree(content.categoryHidden);
  const ready = form.nameAr.trim() !== "" && form.price > 0 && Boolean(form.categoryId);
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);
  const unsaved = useRef(false);
  unsaved.current = dirty;

  // Leaving with unsaved input asks first; the prompt can save the product (it only leaves when the save worked).
  const saveRef = useRef<(leave: boolean) => Promise<boolean>>(async () => true);
  useEffect(() => (shopMode ? shopMode.registerGuard(() => unsaved.current, () => saveRef.current(false)) : registerLeaveGuard(() => unsaved.current, { save: () => saveRef.current(false), anySub: true })), [shopMode]);
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
      setError("الاسم بالعربي والقسم والسعر مطلوبين قبل الحفظ.");
      return false;
    }
    setSaving(true);
    setError("");
    try {
      await (shopMode ? shopMode.submit : addProduct)({
        ...form,
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim(),
        nameUr: (form.nameUr ?? "").trim(),
        compareAt: form.compareAt > form.price ? form.compareAt : form.price,
        // Only a still-valid wholesale price is kept (the server checks it again).
        wholesalePrice: validWholesale({ price: form.price, wholesalePrice: form.wholesalePrice }),
      });
      onAdded();
      // Saved: nothing is left to lose, so the leave prompt must not ask again.
      unsaved.current = false;
      if (leave) onClose();
      return true;
    } catch (failure) {
      setError(apiMessage(failure));
      return false;
    } finally {
      setSaving(false);
    }
  }
  saveRef.current = save;

  return (
    <div className="space-y-6">
      <PageHead
        title="إضافة منتج"
        lead={
          shopMode
            ? dirty
              ? "فيه تعديلات ما اتبعتت. اضغط إرسال للمراجعة عشان توصل للإدارة."
              : "يوصل المنتج للإدارة للمراجعة، وما يظهر في المتجر إلا بعد موافقتها."
            : dirty
              ? "فيه تعديلات غير محفوظة. اضغط حفظ عشان يظهر المنتج في الموقع."
              : "المنتج يظهر في قسمه في الموقع أول ما تحفظه."
        }
        actions={
          <Button variant="primary" icon={shopMode ? Send : Save} onClick={() => void save()} disabled={!ready || saving}>
            {saving ? (shopMode ? "جاري الإرسال…" : "جاري الحفظ…") : shopMode ? "إرسال للمراجعة" : "حفظ المنتج"}
          </Button>
        }
      />

      {error ? (
        <p role="alert" className="rounded-xl border border-(--a-danger)/30 px-4 py-3 text-sm text-(--a-danger)">
          {error}
        </p>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <Panel title="البيانات الأساسية">
            <div className="space-y-5 p-5">
              <BilingualField label="اسم المنتج" ar={form.nameAr} en={form.nameEn} ur={form.nameUr ?? ""} onAr={(nameAr) => set({ nameAr })} onEn={(nameEn) => set({ nameEn })} onUr={(nameUr) => set({ nameUr })} />
              <SearchSelect
                label="القسم في المتجر"
                value={form.categoryId ?? ""}
                onChange={(categoryId) => set({ categoryId: categoryId || undefined, ...labelsFor(categoryId) })}
                options={[["", "اختر القسم"], ...tree.map((item): [string, string] => [item.id, `${"\u00a0\u00a0\u00a0".repeat(item.level - 1)}${item.nameAr}`])]}
              />
              {shopMode ? null : <Select label="المحل" value={form.shopId ?? ""} onChange={(shopId) => set({ shopId: shopId || null })} options={shopOptions(shops)} />}
              <BilingualField
                label="اسم القسم الظاهر على المنتج"
                ar={form.categoryAr}
                en={form.categoryEn}
                ur={form.categoryUr ?? ""}
                onAr={(categoryAr) => set({ categoryAr })}
                onEn={(categoryEn) => set({ categoryEn })}
                onUr={(categoryUr) => set({ categoryUr })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <PriceField label="السعر (ر.س)" value={form.price} onChange={(price) => set({ price })} />
                <WholesaleField value={form.wholesalePrice} price={form.price} hasShop={Boolean(form.shopId)} connected={connected} onChange={(wholesalePrice) => set({ wholesalePrice })} />
                <PriceField label="السعر قبل الخصم (ر.س، اختياري)" value={form.compareAt} onChange={(compareAt) => set({ compareAt })} />
              </div>
              <p className="text-xs leading-6 text-(--a-muted)">الحقول المطلوبة: الاسم بالعربي، القسم، والسعر. الإنجليزي والأوردو اختياريين، وإن تُركوا فارغين يظهر النص العربي.</p>
            </div>
          </Panel>

          <Panel title="صفحة المنتج" lead="اللي يظهر للعميل لما يفتح صفحة المنتج. الأسطر الفاضية ما تتحفظ.">
            <div className="p-5">
              <ProductPageFields draft={{ ...form, id: "" }} onChange={set} />
            </div>
          </Panel>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <Panel title="الصورة">
            <div className="grid place-items-center gap-3 p-5">
              <div className="grid w-full place-items-center rounded-2xl bg-(--a-surface-2) py-6">
                {form.image ? <img src={form.image} alt="" className="size-40 object-contain" /> : <span className="grid size-40 place-items-center rounded-2xl border border-dashed border-(--a-line) text-xs text-(--a-muted)">بدون صورة</span>}
              </div>
              <ImagePicker label={form.image ? "تغيير الصورة" : "رفع صورة المنتج"} onPick={(image) => set({ image })} />
              <p className="text-center text-xs leading-6 text-(--a-muted)">PNG أو JPG أو WebP. الصورة تتصغّر تلقائيًا، وأفضل تكون بخلفية بيضاء أو شفافة.</p>
            </div>
          </Panel>
          {shopMode ? null : (
            <Panel title="الظهور">
              <div className="space-y-3 p-5">
                <ToggleRow label="معروض في المتجر" checked={!form.hidden} onChange={(next) => set({ hidden: !next })} />
                <ToggleRow label="في عروض الصفحة الرئيسية" checked={form.onHome} disabled={form.hidden} onChange={(onHome) => set({ onHome })} />
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

type Lang = "ar" | "en" | "ur";
const LANGS: Lang[] = ["ar", "en", "ur"];
const LIST_KEY = { features: { ar: "featuresAr", en: "featuresEn", ur: "featuresUr" }, specs: { ar: "specsAr", en: "specsEn", ur: "specsUr" } } as const;

/** Product page copy drafts: description, highlights and the spec table. Only complete rows are kept for Save. */
/** The built-in Urdu highlights and specs of a built-in product; undefined when it only has the Arabic fallback. */
function ownUrdu(id: string) {
  const urdu = offerDetail("ur", id);
  return urdu && urdu !== offerDetail("ar", id) ? urdu : undefined;
}

function ProductPageFields({
  draft,
  onChange,
}: {
  /** `id` finds the built-in copy of a built-in product; a product that is being added has none (empty). */
  draft: Pick<ProductRow, PageCopyKey> & { id: string };
  onChange: (patch: Partial<Pick<ProductRow, PageCopyKey>>) => void;
}) {
  // A product that is being added starts with one empty line / row in each language, ready to type in.
  const isNew = draft.id === "";
  const [features, setFeatures] = useState<Record<Lang, string[]>>(() => ({
    ar: draft.featuresAr ?? offerDetail("ar", draft.id)?.features ?? (isNew ? [""] : []),
    en: draft.featuresEn ?? offerDetail("en", draft.id)?.features ?? (isNew ? [""] : []),
    ur: draft.featuresUr ?? ownUrdu(draft.id)?.features ?? (isNew ? [""] : []),
  }));
  const [specs, setSpecs] = useState<Record<Lang, ProductSpec[]>>(() => ({
    ar: draft.specsAr ?? offerDetail("ar", draft.id)?.specs.map(([label, value]) => ({ label, value })) ?? (isNew ? [{ label: "", value: "" }] : []),
    en: draft.specsEn ?? offerDetail("en", draft.id)?.specs.map(([label, value]) => ({ label, value })) ?? (isNew ? [{ label: "", value: "" }] : []),
    ur: draft.specsUr ?? ownUrdu(draft.id)?.specs.map(([label, value]) => ({ label, value })) ?? (isNew ? [{ label: "", value: "" }] : []),
  }));

  function changeFeatures(lang: Lang, list: string[]) {
    setFeatures((current) => ({ ...current, [lang]: list }));
    const clean = list.map((item) => item.trim()).filter(Boolean);
    onChange({ [LIST_KEY.features[lang]]: clean });
  }

  function changeSpecs(lang: Lang, list: ProductSpec[]) {
    setSpecs((current) => ({ ...current, [lang]: list }));
    const clean = list.map((row) => ({ label: row.label.trim(), value: row.value.trim() })).filter((row) => row.label && row.value);
    onChange({ [LIST_KEY.specs[lang]]: clean });
  }

  return (
    <div className="space-y-5">
      <BilingualField
        label="وصف المنتج (اختياري)"
        ar={draft.descriptionAr ?? ""}
        en={draft.descriptionEn ?? ""}
        ur={draft.descriptionUr ?? ""}
        onAr={(descriptionAr) => onChange({ descriptionAr })}
        onEn={(descriptionEn) => onChange({ descriptionEn })}
        onUr={(descriptionUr) => onChange({ descriptionUr })}
        multiline
      />

      <div>
        <LangHeader label="أبرز التفاصيل" />
        <div className="space-y-2">
          {Array.from({ length: Math.max(0, ...LANGS.map((lang) => features[lang].length)) }, (_, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-3">
                {LANGS.map((lang) => (
                  <input
                    key={lang}
                    dir={lang === "en" ? "ltr" : "rtl"}
                    value={features[lang][index] ?? ""}
                    onChange={(event) => changeFeatures(lang, setAt(features[lang], index, event.target.value, ""))}
                    placeholder={lang === "ar" ? "مثال: ضمان محلي لمدة سنتين" : lang === "ur" ? "مثال: دو سال کی مقامی وارنٹی" : "e.g. Two-year local warranty"}
                    aria-label={`${LANG_NAME[lang]}: سطر ${index + 1}`}
                    className={cn(control, "h-10")}
                  />
                ))}
              </div>
              {/* One delete removes the line in all three languages. */}
              <IconButton icon={Trash2} tone="danger" label="حذف السطر" onClick={() => LANGS.forEach((lang) => changeFeatures(lang, features[lang].filter((_, at) => at !== index)))} />
            </div>
          ))}
        </div>
        {/* One button adds a line to all three languages at once. */}
        <div className="mt-3">
          <Button icon={Plus} onClick={() => setFeatures((current) => ({ ar: [...current.ar, ""], en: [...current.en, ""], ur: [...current.ur, ""] }))}>
            إضافة سطر
          </Button>
        </div>
      </div>

      <div>
        <LangHeader label="بيانات المنتج (جدول المواصفات)" />
        <div className="space-y-2">
          {Array.from({ length: Math.max(0, ...LANGS.map((lang) => specs[lang].length)) }, (_, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-3">
                {LANGS.map((lang) => {
                  const row = specs[lang][index] ?? { label: "", value: "" };
                  const names = lang === "ar" ? ["البند", "القيمة"] : lang === "ur" ? ["عنوان", "قدر"] : ["Label", "Value"];
                  return (
                    <div key={lang} dir={lang === "en" ? "ltr" : "rtl"} className="flex items-center gap-2">
                      <input
                        value={row.label}
                        onChange={(event) => changeSpecs(lang, setAt(specs[lang], index, { ...row, label: event.target.value }, { label: "", value: "" }))}
                        placeholder={names[0]}
                        aria-label={`${LANG_NAME[lang]}: ${names[0]} ${index + 1}`}
                        className={cn(control, "h-10 w-2/5")}
                      />
                      <input
                        value={row.value}
                        onChange={(event) => changeSpecs(lang, setAt(specs[lang], index, { ...row, value: event.target.value }, { label: "", value: "" }))}
                        placeholder={names[1]}
                        aria-label={`${LANG_NAME[lang]}: ${names[1]} ${index + 1}`}
                        className={cn(control, "h-10 flex-1")}
                      />
                    </div>
                  );
                })}
              </div>
              {/* One delete removes the row in all three languages. */}
              <IconButton icon={Trash2} tone="danger" label="حذف الصف" onClick={() => LANGS.forEach((lang) => changeSpecs(lang, specs[lang].filter((_, at) => at !== index)))} />
            </div>
          ))}
        </div>
        {/* One button adds a row to all three languages at once. */}
        <div className="mt-3">
          <Button icon={Plus} onClick={() => setSpecs((current) => ({ ar: [...current.ar, { label: "", value: "" }], en: [...current.en, { label: "", value: "" }], ur: [...current.ur, { label: "", value: "" }] }))}>
            إضافة صف
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Replaces the item at `index`, padding the list with `blank` when that language has fewer rows. */
function setAt<T>(list: T[], index: number, value: T, blank: T): T[] {
  const next = [...list];
  while (next.length <= index) next.push(blank);
  next[index] = value;
  return next;
}

const LANG_NAME: Record<Lang, string> = { ar: "عربي", en: "إنجليزي", ur: "أوردو" };

/** Above the columns: the language tag and the field name, the same look as the labels of the fields above. */
function LangHeader({ label }: { label: string }) {
  return (
    <div className="mb-1.5 flex items-center gap-2">
      <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-3">
        {LANGS.map((lang) => (
          <span key={lang} className="flex items-center gap-2 text-xs font-medium text-(--a-muted)">
            <LangTag lang={lang} />
            {label}
          </span>
        ))}
      </div>
      <span className="size-9 shrink-0" aria-hidden />
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
    <span className={cn("inline-block rounded px-1.5 py-px text-[10px] font-semibold", lang === "en" ? "bg-(--a-blue-soft) text-(--a-blue)" : lang === "ur" ? "bg-(--a-ok-soft) text-(--a-ok)" : "bg-(--a-accent-soft) text-(--a-accent-ink)")}>
      {lang === "en" ? "EN" : lang === "ur" ? "UR" : "AR"}
    </span>
  );
}

/** Fields the edit form can change; used to detect unsaved drafts. */
const EDIT_KEYS = [
  "nameAr",
  "nameEn",
  "nameUr",
  "categoryAr",
  "categoryEn",
  "categoryUr",
  "categoryId",
  "shopId",
  "price",
  "compareAt",
  "wholesalePrice",
  "hidden",
  "onHome",
  "image",
  "descriptionAr",
  "descriptionEn",
  "descriptionUr",
  "featuresAr",
  "featuresEn",
  "featuresUr",
  "specsAr",
  "specsEn",
  "specsUr",
] as const;

function productDraftDirty(draft: ProductRow, saved: ProductRow) {
  return EDIT_KEYS.some((key) => JSON.stringify(draft[key] ?? null) !== JSON.stringify(saved[key] ?? null));
}

/** Full-page product editor: edits stay as a draft until Save. */
function ProductEditor({ product }: { product: ProductRow }) {
  const { content, saveProduct, shops, catalogue } = useSiteContent();
  const connected = catalogue.source === "admin";
  const [draft, setDraft] = useState(product);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const dirty = useMemo(() => productDraftDirty(draft, product), [draft, product]);
  const unsaved = useRef(false);
  unsaved.current = dirty;

  useEffect(() => {
    setDraft(product);
    setError("");
    setJustSaved(false);
  }, [product.id]);

  // After a successful save the parent product updates from the server; keep the draft in sync while clean.
  useEffect(() => {
    if (!dirty) setDraft(product);
  }, [product, dirty]);

  // Leaving with unsaved edits asks first, and the prompt can save them (it only leaves when the save worked).
  const saveRef = useRef<() => Promise<boolean>>(async () => true);
  useEffect(() => registerLeaveGuard(() => unsaved.current, { save: () => saveRef.current(), anySub: true }), []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const patch = (next: Partial<ProductRow>) => {
    setJustSaved(false);
    setDraft((current) => ({ ...current, ...next }));
  };

  async function save(): Promise<boolean> {
    if (!dirty || saving) return false;
    if (!draft.nameAr.trim() || !(draft.price > 0)) {
      setError("الاسم بالعربي والسعر مطلوبين قبل الحفظ.");
      return false;
    }
    setSaving(true);
    setError("");
    try {
      await saveProduct(product.id, {
        nameAr: draft.nameAr.trim(),
        nameEn: draft.nameEn.trim(),
        nameUr: (draft.nameUr ?? "").trim(),
        categoryAr: draft.categoryAr,
        categoryEn: draft.categoryEn,
        categoryUr: draft.categoryUr ?? "",
        categoryId: draft.categoryId,
        shopId: draft.shopId ?? null,
        price: draft.price,
        compareAt: draft.compareAt > draft.price ? draft.compareAt : draft.price,
        wholesalePrice: validWholesale({ price: draft.price, wholesalePrice: draft.wholesalePrice }),
        hidden: draft.hidden,
        onHome: draft.onHome,
        image: draft.image,
        descriptionAr: draft.descriptionAr ?? "",
        descriptionEn: draft.descriptionEn ?? "",
        descriptionUr: draft.descriptionUr ?? "",
        featuresAr: draft.featuresAr ?? null,
        featuresEn: draft.featuresEn ?? null,
        featuresUr: draft.featuresUr ?? null,
        specsAr: draft.specsAr ?? null,
        specsEn: draft.specsEn ?? null,
        specsUr: draft.specsUr ?? null,
      });
      setJustSaved(true);
      return true;
    } catch (failure) {
      setError(apiMessage(failure));
      return false;
    } finally {
      setSaving(false);
    }
  }
  saveRef.current = save;

  return (
    <div className="space-y-6">
      <PageHead
        title={`تعديل: ${product.nameAr}`}
        lead={dirty ? "فيه تعديلات غير محفوظة. اضغط حفظ عشان تظهر على الموقع." : "عدّل البيانات ثم اضغط حفظ."}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/ar/p/${encodeURIComponent(product.id)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-(--a-line) bg-(--a-surface) px-4 text-sm font-medium hover:bg-(--a-surface-2)"
            >
              <ExternalLink className="size-4" />
              عرض صفحة المنتج
            </a>
            <Button variant="primary" icon={justSaved && !dirty ? Check : Save} onClick={save} disabled={!dirty || saving}>
              {saving ? "جاري الحفظ…" : justSaved && !dirty ? "تم الحفظ" : "حفظ"}
            </Button>
          </div>
        }
      />

      {error ? (
        <p role="alert" className="rounded-xl border border-(--a-danger)/30 px-4 py-3 text-sm text-(--a-danger)">
          {error}
        </p>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <Panel title="البيانات الأساسية">
            <div className="space-y-5 p-5">
              <BilingualField label="اسم المنتج" ar={draft.nameAr} en={draft.nameEn} ur={draft.nameUr ?? ""} onAr={(nameAr) => patch({ nameAr })} onEn={(nameEn) => patch({ nameEn })} onUr={(nameUr) => patch({ nameUr })} />
              <SearchSelect
                label="القسم في المتجر"
                value={departmentOf(productCategoryOf(draft) ?? "")?.id ?? ""}
                onChange={(categoryId) => patch({ categoryId })}
                options={[
                  ...(productCategoryOf(draft) ? [] : ([["", "بدون قسم"]] as Array<[string, string]>)),
                  ...departmentTree(content.categoryHidden).map((item): [string, string] => [item.id, `${"\u00a0\u00a0\u00a0".repeat(item.level - 1)}${item.nameAr}`]),
                ]}
              />
              <Select label="المحل" value={draft.shopId ?? ""} onChange={(shopId) => patch({ shopId: shopId || null })} options={shopOptions(shops, draft.shopId)} />
              <BilingualField
                label="اسم القسم الظاهر على المنتج"
                ar={draft.categoryAr}
                en={draft.categoryEn}
                ur={draft.categoryUr ?? ""}
                onAr={(categoryAr) => patch({ categoryAr })}
                onEn={(categoryEn) => patch({ categoryEn })}
                onUr={(categoryUr) => patch({ categoryUr })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <PriceField label="السعر (ر.س)" value={draft.price} onChange={(price) => patch({ price })} />
                <WholesaleField key={product.id} value={draft.wholesalePrice} price={draft.price} hasShop={Boolean(draft.shopId)} connected={connected} onChange={(wholesalePrice) => patch({ wholesalePrice })} />
                <PriceField label="السعر قبل الخصم (ر.س)" value={draft.compareAt} onChange={(compareAt) => patch({ compareAt })} />
              </div>
            </div>
          </Panel>

          <Panel title="صفحة المنتج" lead="اللي يظهر للعميل لما يفتح صفحة المنتج. الأسطر الفاضية ما تتحفظ.">
            <div className="p-5">
              <ProductPageFields key={product.id} draft={draft} onChange={patch} />
            </div>
          </Panel>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <Panel title="الصورة">
            <div className="grid place-items-center gap-3 p-5">
              <div className="grid w-full place-items-center rounded-2xl bg-(--a-surface-2) py-6">
                {draft.image?.startsWith("data:") ? <img src={draft.image} alt="" className="size-40 object-contain" /> : <ProductArt id={product.id} className="size-40" />}
              </div>
              <ImagePicker label={draft.image || !product.source ? "تغيير الصورة" : "إضافة صورة"} onPick={(image) => patch({ image })} />
              <p className="text-center text-xs leading-6 text-(--a-muted)">PNG أو JPG أو WebP. الصورة تتصغّر تلقائيًا، وأفضل تكون بخلفية بيضاء أو شفافة.</p>
            </div>
          </Panel>
          <Panel title="الظهور">
            <div className="space-y-3 p-5">
              <ToggleRow label="معروض في المتجر" checked={!draft.hidden} onChange={(next) => patch({ hidden: !next })} />
              <ToggleRow label="في عروض الصفحة الرئيسية" checked={draft.onHome} disabled={draft.hidden} onChange={(onHome) => patch({ onHome })} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
