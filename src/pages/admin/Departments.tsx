import { useEffect, useMemo, useRef, useState } from "react";
import { ICON_OPTIONS, catalogIcon } from "@/components/site/catalog-icons";
import { TrashIcon } from "@/components/TrashIcon";
import { Link } from "wouter";
import { ArchiveRestore, ChevronLeft, ExternalLink, FolderSearch, GripVertical, PackageSearch, Pencil, Plus, Save, X } from "lucide-react";
import { allCategories, categoryBlurb, categoryById, categoryLabel, type CatalogCategory } from "@/lib/catalog";
import { apiMessage } from "@/lib/api";
import { useSiteContent, type NewCategory, type ProductRow } from "@/lib/site-content";
import { publicUrl } from "@/lib/utils";
import { ProductArt } from "@/components/site/card-art";
import { productInCategory } from "@/lib/product-categories";
import { onHashMove, pushHash, readHash, registerLeaveGuard } from "./nav";
import { ToggleRow } from "./Products";
import { Badge, BilingualField, Button, Confirm, Empty, Field, IconButton, num, PageHead, Pager, Panel, rowOpen, sar, SearchBox, Switch, Tabs, usePager } from "./ui";

type Filter = "main" | "hidden" | "archived";

/** Main departments in storefront order (the store has no subcategories). */
function inTreeOrder(list: CatalogCategory[]) {
  return list.filter((item) => item.level === 1).sort((a, b) => a.sort - b.sort);
}

/** #departments, #departments/<id> (its products), #departments/<id>/edit (its details) or #departments/add (a new department). */
function parseRoute(view: string, sub: string | null) {
  if (view !== "departments" || !sub) return { open: null as string | null, adding: false, edit: null as string | null };
  if (sub === "add") return { open: null, adding: true, edit: null };
  // #departments/<id>/edit: the department's own edit page.
  if (sub.endsWith("/edit")) return { open: null, adding: false, edit: sub.slice(0, -5) };
  return { open: sub, adding: false, edit: null };
}

export function Departments() {
  const { content, setCategoryHidden, setCategoryArchived, updateProduct, reorderCategories } = useSiteContent();
  // The store has main departments only; products sit straight under a department.
  const catalog = inTreeOrder(allCategories());
  const isAdded = (id: string) => content.addedCategories.some((item) => item.id === id);
  const [filter, setFilter] = useState<Filter>("main");
  const [query, setQuery] = useState("");
  const [archiving, setArchiving] = useState<CatalogCategory | null>(null);
  const [archivingProduct, setArchivingProduct] = useState<ProductRow | null>(null);
  // The department being browsed lives in the URL (#departments/<id>), so back returns to the level above.
  // "Add department" is its own page (#departments/add), also reached from the overview's quick actions.
  const [route, setRoute] = useState(() => parseRoute(readHash().view, readHash().sub));
  useEffect(() => onHashMove(() => setRoute(parseRoute(readHash().view, readHash().sub))), []);
  const openId = route.open;
  const adding = route.adding;
  const setOpenId = (id: string | null) => pushHash("departments", id);

  const archived = content.categoryArchived;
  const hiddenOnly = (item: CatalogCategory) => content.categoryHidden.includes(item.id) && !archived.includes(item.id);
  const counts = {
    main: catalog.filter((item) => item.level === 1 && !archived.includes(item.id)).length,
    hidden: catalog.filter((item) => hiddenOnly(item) || !item.active).length,
    archived: archived.length,
  };
  const editing = route.edit ? categoryById(route.edit) : null;
  const editDepartment = (id: string) => pushHash("departments", `${id}/edit`);
  const opened = openId ? categoryById(openId) : null;
  const productsOf = (id: string) => content.products.filter((item) => !item.archived && productInCategory(item, id));
  // A department opens onto its products.
  const showingProducts = opened !== null;
  const needle = query.trim().toLowerCase();
  const productRows = showingProducts ? productsOf(opened.id).filter((item) => !needle || [item.nameAr, item.nameEn].some((text) => text.toLowerCase().includes(needle))) : [];
  const allRows = catalog.filter((item) => {
    const gone = archived.includes(item.id);
    if (filter === "archived" ? !gone : gone) return false;
    if (filter === "hidden" && !(hiddenOnly(item) || !item.active)) return false;
    if (needle && ![item.nameAr, item.nameEn, item.slug].some((text) => text.toLowerCase().includes(needle))) return false;
    return true;
  });
  const rowsPager = usePager(allRows, `${filter}|${query}|${opened?.id ?? ""}`);
  const productsPager = usePager(productRows, `${query}|${opened?.id ?? ""}`);
  // Departments can be dragged into a new order, but not while searching or on the stopped / deleted tabs,
  // where the list is not the full set of departments.
  const orderable = !showingProducts && !needle && filter === "main";
  const rows = orderable ? allRows : rowsPager.rows;
  const [drag, setDrag] = useState<{ id: string; over: string | null; after: boolean } | null>(null);
  const [orderError, setOrderError] = useState("");
  function dropAt(targetId: string, after: boolean) {
    if (!drag || drag.id === targetId) return setDrag(null);
    const ids = allRows.map((item) => item.id).filter((id) => id !== drag.id);
    const at = ids.indexOf(targetId);
    ids.splice(at + (after ? 1 : 0), 0, drag.id);
    setDrag(null);
    setOrderError("");
    reorderCategories(ids).catch((failure) => setOrderError(apiMessage(failure)));
  }

  if (adding) return <AddDepartmentPage onClose={() => pushHash("departments")} />;
  if (route.edit && editing) return <EditDepartmentPage key={editing.id} category={editing} hidden={content.categoryHidden.includes(editing.id)} canRename={isAdded(editing.id)} onClose={() => pushHash("departments")} />;

  return (
    <div className="space-y-6">
      <PageHead
        title="الأقسام"
        lead="نفس أقسام الموقع وترتيبها. اضغط على القسم لتشوف منتجاته."
        actions={
          showingProducts ? (
            <Button variant="primary" icon={Plus} onClick={() => pushHash("products", `${opened.id}/add`)}>
              إضافة منتج
            </Button>
          ) : (
            <Button variant="primary" icon={Plus} onClick={() => pushHash("departments", "add")}>
              إضافة قسم
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        {opened ? null : (
          <Tabs
            value={filter}
            onChange={setFilter}
            items={[
              ["main", "الأقسام", counts.main],
              ["hidden", "موقوف", counts.hidden],
              ["archived", "الأرشيف", counts.archived],
            ]}
          />
        )}
        <SearchBox value={query} onChange={setQuery} placeholder={opened ? `ابحث داخل ${opened.nameAr}` : "ابحث باسم القسم"} />
      </div>

      {orderError ? (
        <p role="alert" className="rounded-xl border border-(--a-danger)/30 px-4 py-3 text-sm text-(--a-danger)">
          {orderError}
        </p>
      ) : null}
      {orderable ? <p className="text-xs text-(--a-muted)">اسحب أي قسم من المقبض وغيّر مكانه. الترتيب يتحفظ فورًا ويظهر في الموقع.</p> : null}

      <Panel>
        {showingProducts ? (
          productRows.length ? (
            <ul className="divide-y divide-(--a-line)">
              {productsPager.rows.map((item) => (
                <li
                  key={item.id}
                  {...rowOpen(() => pushHash("products", `${opened.id}/edit-${item.id}`))}
                  className="flex cursor-pointer flex-wrap items-center gap-4 px-5 py-2.5"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--a-surface-2)">
                    <ProductArt id={item.id} className="size-8" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5">
                      <span className="line-clamp-1 font-medium">{item.nameAr}</span>
                      {item.source === "demo" ? <Badge tone="blue">تجريبي</Badge> : item.source === "added" ? <Badge tone="blue">مضاف</Badge> : null}
                    </p>
                    <p className="mt-0.5 text-xs text-(--a-muted)">{item.categoryAr}</p>
                  </div>
                  <div className="text-end">
                    <p className="font-semibold tabular-nums">{sar.format(item.price)}</p>
                    {item.compareAt > item.price ? <s className="text-xs text-(--a-muted) tabular-nums">{sar.format(item.compareAt)}</s> : null}
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch size="sm" checked={!item.hidden} label={`إظهار ${item.nameAr}`} onChange={(next) => updateProduct(item.id, { hidden: !next })} />
                    <span className="w-2" />
                    <IconButton icon={Pencil} label={`تعديل ${item.nameAr}`} onClick={() => pushHash("products", `${opened.id}/edit-${item.id}`)} />
                    <IconButton icon={TrashIcon} label={`حذف ${item.nameAr}`} tone="danger" onClick={() => setArchivingProduct(item)} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty
              icon={PackageSearch}
              title="ما فيه منتجات هنا"
              lead={needle ? "جرّب كلمة بحث ثانية." : "هذا القسم ما فيه منتجات لسه. أضف منتج من زر إضافة منتج."}
            />
          )
        ) : rows.length ? (
          <ul className="divide-y divide-(--a-line)">
            {rows.map((item) => {
              const gone = archived.includes(item.id);
              const visible = item.active && !content.categoryHidden.includes(item.id);
              // A department opens onto its products.
              const opens = !gone;
              const details = (
                <>
                  <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-(--a-surface-2)">
                    {item.image ? <img src={publicUrl(item.image)} alt="" className="size-8 object-contain" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{item.nameAr}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-(--a-muted)">
                      <span dir="ltr">{item.nameEn}</span>
                      <span>·</span>
                      <span>{num.format(productsOf(item.id).length)} منتج</span>
                    </span>
                  </span>
                  {opens ? <ChevronLeft className="size-4 shrink-0 text-(--a-muted) transition group-hover:text-(--a-accent-ink)" /> : null}
                </>
              );
              return (
                <li
                  key={item.id}
                  {...(gone
                    ? {}
                    : rowOpen(() => {
                        if (opens) {
                          setOpenId(item.id);
                          setQuery("");
                        } else editDepartment(item.id);
                      }))}
                  draggable={orderable}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", item.id);
                    setDrag({ id: item.id, over: null, after: false });
                  }}
                  onDragOver={(event) => {
                    if (!drag) return;
                    event.preventDefault();
                    const box = event.currentTarget.getBoundingClientRect();
                    const after = event.clientY > box.top + box.height / 2;
                    if (drag.over !== item.id || drag.after !== after) setDrag({ ...drag, over: item.id, after });
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    dropAt(item.id, drag?.after ?? false);
                  }}
                  onDragEnd={() => setDrag(null)}
                  className={`flex flex-wrap items-center gap-4 px-5 py-2.5${gone ? "" : " cursor-pointer"}${drag?.id === item.id ? " opacity-40" : ""}${drag?.over === item.id && drag.id !== item.id ? (drag.after ? " shadow-[inset_0_-2px_0_var(--a-accent)]" : " shadow-[inset_0_2px_0_var(--a-accent)]") : ""}`}
                >
                  {orderable ? (
                    <span title="اسحب لإعادة الترتيب" aria-label={`اسحب ${item.nameAr} لإعادة الترتيب`} className="-ms-2 grid size-8 shrink-0 cursor-grab place-items-center rounded-lg text-(--a-muted) hover:bg-(--a-surface-2) active:cursor-grabbing">
                      <GripVertical className="size-4" />
                    </span>
                  ) : null}
                  {opens ? (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenId(item.id);
                        setQuery("");
                      }}
                      aria-label={`فتح منتجات ${item.nameAr}`}
                      className="group -my-2 -ms-2 flex min-w-0 flex-1 items-center gap-4 rounded-xl py-2 ps-2 text-start transition hover:bg-(--a-surface-2)/60"
                    >
                      {details}
                    </button>
                  ) : (
                    <div className="flex min-w-0 flex-1 items-center gap-4">{details}</div>
                  )}
                  <div className="flex items-center gap-1.5">
                    {!item.active ? <Badge tone="warn">غير نشط</Badge> : null}
                    {isAdded(item.id) ? <Badge tone="blue">مضاف من اللوحة</Badge> : null}
                  </div>
                  <div className="flex items-center gap-1">
                    {gone ? (
                      <Button icon={ArchiveRestore} onClick={() => setCategoryArchived(item.id, false)}>
                        استرجاع
                      </Button>
                    ) : (
                      <>
                        <Switch size="sm" checked={visible} disabled={!item.active} label={`إظهار قسم ${item.nameAr}`} onChange={(next) => setCategoryHidden(item.id, !next)} />
                        <span className="w-2" />
                        <IconButton icon={Pencil} label={`تعديل ${item.nameAr}`} onClick={() => editDepartment(item.id)} />
                        <IconButton icon={TrashIcon} label={`حذف ${item.nameAr}`} tone="danger" onClick={() => setArchiving(item)} />
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty icon={FolderSearch} title="ما فيه أقسام هنا" lead={filter === "archived" ? "الأقسام المحذوفة تنتقل للأرشيف وتقدر تسترجعها." : "جرّب كلمة بحث ثانية أو غيّر الفلتر."} />
        )}
        {orderable ? null : <Pager pager={showingProducts ? productsPager : rowsPager} />}
      </Panel>

      <Confirm
        open={archivingProduct !== null}
        onClose={() => setArchivingProduct(null)}
        onConfirm={() => archivingProduct && updateProduct(archivingProduct.id, { archived: true })}
        title={`حذف ${archivingProduct?.nameAr ?? ""}؟`}
        lead="المنتج يختفي من المتجر وينتقل للأرشيف في صفحة المنتجات. بياناته تبقى محفوظة وتقدر تسترجعه في أي وقت."
        action="نقل للأرشيف"
      />

      <Confirm
        open={archiving !== null}
        onClose={() => setArchiving(null)}
        onConfirm={() => archiving && setCategoryArchived(archiving.id, true)}
        title={`حذف قسم ${archiving?.nameAr ?? ""}؟`}
        lead="القسم يختفي من المتجر وينتقل للأرشيف. تقدر تسترجعه في أي وقت."
        action="نقل للأرشيف"
      />
    </div>
  );
}

const EMPTY: NewCategory = { nameAr: "", nameEn: "", nameUr: "", descriptionAr: "", descriptionEn: "", descriptionUr: "", parentId: null, featured: false, icon: "grid" };

/** The Urdu name and description a department shows now: its own, else the built-in Urdu copy; empty when it only has the Arabic fallback. */
function urduOf(category: CatalogCategory) {
  const name = categoryLabel(category, "ur");
  const text = categoryBlurb(category, "ur");
  return { name: name === category.nameAr ? "" : name, description: text === category.descriptionAr ? "" : text };
}

/** Shows the department's icon and, on "add / change icon", a grid of every icon the store can use. */
function IconPicker({ value, onChange, disabled }: { value: string; onChange: (id: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const Current = catalogIcon(value);
  const needle = query.trim().toLowerCase();
  const options = ICON_OPTIONS.filter((item) => !needle || item.label.includes(needle) || item.id.includes(needle));
  const label = ICON_OPTIONS.find((item) => item.id === value)?.label ?? "عام";
  return (
    <div className="space-y-3">
      <span className="block text-xs font-medium text-(--a-muted)">الأيقونة</span>
      <div className="flex items-center gap-3">
        <span className="grid size-14 place-items-center rounded-2xl border border-(--a-line) bg-(--a-surface-2) text-(--a-accent-ink)">
          <Current className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-(--a-muted)">تظهر على كرت القسم في الموقع وفي القائمة.</p>
        </div>
      </div>
      <Button icon={open ? X : Plus} onClick={() => setOpen(!open)} disabled={disabled}>
        {open ? "إغلاق القائمة" : value && value !== "grid" ? "تغيير الأيقونة" : "إضافة أيقونة"}
      </Button>
      {open ? (
        <div className="space-y-3">
          <SearchBox value={query} onChange={setQuery} placeholder="ابحث عن أيقونة" />
          <div className="grid max-h-72 grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8 overflow-y-auto rounded-xl border border-(--a-line) p-2">
            {options.map((item) => {
              const Icon = catalogIcon(item.id);
              const on = item.id === value;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  aria-label={item.label}
                  aria-pressed={on}
                  onClick={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                  className={`grid cursor-pointer place-items-center gap-1 rounded-xl border px-1 py-2.5 text-[11px] transition ${on ? "border-(--a-accent) bg-(--a-accent)/10 text-(--a-accent-ink)" : "border-transparent text-(--a-muted) hover:border-(--a-line) hover:text-(--a-text)"}`}
                >
                  <Icon className="size-5" />
                  <span className="line-clamp-1">{item.label}</span>
                </button>
              );
            })}
            {options.length === 0 ? <p className="col-span-full py-6 text-center text-xs text-(--a-muted)">ما فيه أيقونة بهذا الاسم.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Edit page for a department (#departments/<id>/edit): changes stay as a draft until Save, and leaving with unsaved changes asks first. */
function EditDepartmentPage({ category, hidden, canRename, onClose }: { category: CatalogCategory; hidden: boolean; canRename: boolean; onClose: () => void }) {
  const { saveCategory, catalogue } = useSiteContent();
  // With the database every department's icon can be changed; in the local preview only departments added here can.
  const canIcon = catalogue.source === "admin" || canRename;
  const initial = useMemo(
    () => ({
      nameAr: category.nameAr,
      nameEn: category.nameEn,
      nameUr: urduOf(category).name,
      descriptionAr: category.descriptionAr,
      descriptionEn: category.descriptionEn,
      descriptionUr: urduOf(category).description,
      hidden,
      icon: category.icon || "grid",
    }),
    [category, hidden],
  );
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(initial), [draft, initial]);
  const unsaved = useRef(false);
  unsaved.current = dirty;

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
    if (!dirty || saving) return !dirty;
    setSaving(true);
    setError("");
    try {
      await saveCategory(category.id, {
        nameAr: draft.nameAr.trim(),
        nameEn: draft.nameEn.trim(),
        nameUr: draft.nameUr.trim(),
        descriptionAr: draft.descriptionAr.trim(),
        descriptionEn: draft.descriptionEn.trim(),
        descriptionUr: draft.descriptionUr.trim(),
        hidden: draft.hidden,
        ...(draft.icon !== initial.icon ? { icon: draft.icon } : {}),
      });
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
  const set = (patch: Partial<typeof draft>) => setDraft((current) => ({ ...current, ...patch }));

  return (
    <div className="space-y-6">
      <PageHead
        title={`تعديل قسم ${category.nameAr}`}
        lead={dirty ? "فيه تعديلات غير محفوظة. اضغط حفظ عشان تظهر على الموقع." : "عدّل البيانات ثم اضغط حفظ عشان تظهر على الموقع."}
        actions={
          <>
            <Link href={`/ar/c/${category.slug}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-(--a-line) px-4 text-sm">
              <ExternalLink className="size-4" />
              فتح في المتجر
            </Link>
            <Button onClick={onClose}>إلغاء</Button>
            <Button variant="primary" icon={Save} onClick={() => void save()} disabled={!dirty || saving}>
              {saving ? "جاري الحفظ…" : "حفظ"}
            </Button>
          </>
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
              <BilingualField
                label="اسم القسم"
                ar={draft.nameAr}
                en={draft.nameEn}
                ur={draft.nameUr}
                onAr={(nameAr) => set({ nameAr })}
                onEn={(nameEn) => set({ nameEn })}
                onUr={(nameUr) => set({ nameUr })}
                disabled={!canRename}
              />
              <BilingualField
                label="الوصف"
                ar={draft.descriptionAr}
                en={draft.descriptionEn}
                ur={draft.descriptionUr}
                onAr={(descriptionAr) => set({ descriptionAr })}
                onEn={(descriptionEn) => set({ descriptionEn })}
                onUr={(descriptionUr) => set({ descriptionUr })}
                multiline
                disabled={!canRename}
              />
              <IconPicker value={draft.icon} onChange={(icon) => set({ icon })} disabled={!canIcon} />
              <Field label="الرابط" value={category.slug} onChange={() => {}} dir="ltr" disabled />
              {canRename ? null : <p className="text-xs leading-6 text-(--a-muted)">اسم ووصف الأقسام الأساسية ثابتة. تقدر توقف القسم أو تظهره من الجانب.</p>}
            </div>
          </Panel>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <Panel title="الصورة">
            <div className="grid place-items-center p-5">
              <div className="grid w-full place-items-center rounded-2xl bg-(--a-surface-2) py-6">
                {category.image ? <img src={publicUrl(category.image)} alt="" className="size-32 object-contain" /> : <span className="grid size-32 place-items-center rounded-2xl border border-dashed border-(--a-line) text-xs text-(--a-muted)">بدون صورة</span>}
              </div>
            </div>
          </Panel>
          <Panel title="الظهور">
            <div className="p-5">
              <ToggleRow label="ظاهر في المتجر" checked={category.active && !draft.hidden} disabled={!category.active} onChange={(next) => set({ hidden: !next })} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/** Add department page (#departments/add): saved with the site content and shown in the store right away. */
function AddDepartmentPage({ onClose }: { onClose: () => void }) {
  const { addCategory } = useSiteContent();
  const initial = EMPTY;
  const [form, setForm] = useState<NewCategory>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (patch: Partial<NewCategory>) => setForm((current) => ({ ...current, ...patch }));
  const ready = form.nameAr.trim() !== "" && form.nameEn.trim() !== "";
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);
  const unsaved = useRef(false);
  unsaved.current = dirty;

  // Leaving with unsaved input asks first; the prompt can save the department (it only leaves when the save worked).
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
      setError("اسم القسم بالعربي والإنجليزي مطلوب قبل الحفظ.");
      return false;
    }
    setSaving(true);
    setError("");
    try {
      await addCategory({ ...form, nameAr: form.nameAr.trim(), nameEn: form.nameEn.trim(), nameUr: (form.nameUr ?? "").trim(), descriptionAr: form.descriptionAr.trim(), descriptionEn: form.descriptionEn.trim(), descriptionUr: (form.descriptionUr ?? "").trim() });
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
        title="إضافة قسم"
        lead={dirty ? "فيه تعديلات غير محفوظة. اضغط حفظ عشان يظهر القسم في الموقع." : "القسم يظهر في قائمة أقسام الموقع وفي فلتر المنتجات أول ما تحفظه."}
        actions={
          <Button variant="primary" icon={Save} onClick={() => void save()} disabled={!ready || saving}>
            {saving ? "جاري الحفظ…" : "حفظ القسم"}
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
              <BilingualField label="اسم القسم" ar={form.nameAr} en={form.nameEn} ur={form.nameUr ?? ""} onAr={(nameAr) => set({ nameAr })} onEn={(nameEn) => set({ nameEn })} onUr={(nameUr) => set({ nameUr })} />
              <BilingualField
                label="الوصف"
                ar={form.descriptionAr}
                en={form.descriptionEn}
                ur={form.descriptionUr ?? ""}
                onAr={(descriptionAr) => set({ descriptionAr })}
                onEn={(descriptionEn) => set({ descriptionEn })}
                onUr={(descriptionUr) => set({ descriptionUr })}
                multiline
              />
              <IconPicker value={form.icon ?? "grid"} onChange={(icon) => set({ icon })} />
              <p className="text-xs leading-6 text-(--a-muted)">الحقول المطلوبة: اسم القسم بالعربي والإنجليزي. الأوردو اختياري، وإن تُرك فارغًا يظهر الاسم الأوردو الجاهز للأقسام الأساسية أو العربي. القسم يتحفظ في قاعدة بيانات المتجر.</p>
            </div>
          </Panel>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <Panel title="الصورة">
            <div className="grid place-items-center gap-3 p-5">
              <div className="grid w-full place-items-center rounded-2xl bg-(--a-surface-2) py-6">
                <span className="grid size-40 place-items-center rounded-2xl border border-dashed border-(--a-line) text-xs text-(--a-muted)">بدون صورة</span>
              </div>
              <p className="text-center text-xs leading-6 text-(--a-muted)">صورة القسم تتفعّل لاحقًا مع تخزين الصور، وحاليًا يظهر بأيقونة.</p>
            </div>
          </Panel>
          {form.parentId === null ? (
            <Panel title="الظهور">
              <div className="p-5">
                <ToggleRow label="يظهر في شبكة أقسام الصفحة الرئيسية" checked={form.featured} onChange={(featured) => set({ featured })} />
              </div>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
