import { useEffect, useRef, useState } from "react";
import { Boxes, PackageCheck, PackageSearch, PackageX, TriangleAlert } from "lucide-react";
import { ProductArt } from "@/components/site/card-art";
import { useSiteContent } from "@/lib/site-content";
import { STOCK_LEVEL, stockLevel, useOps, type StockLevel } from "./ops";
import { registerLeaveGuard } from "./nav";
import { useShopScope } from "./shopScope";
import { Badge, Button, DemoNote, Empty, num, NumberField, PageHead, Pager, Panel, SearchBox, StatCard, Tabs, usePager } from "./ui";

type Filter = "all" | StockLevel;

export function Inventory() {
  const { content } = useSiteContent();
  const { ops, setStock, setLowStock } = useOps();
  // The alert threshold is the store's: a shop can read it but not change it.
  const inShop = useShopScope() !== null;
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  // Typed quantities wait here until "حفظ" is pressed; nothing is written to the store before that.
  const [draftStock, setDraftStock] = useState<Record<string, number | null>>({});
  const [draftLow, setDraftLow] = useState<number | null | undefined>(undefined);
  const [saved, setSaved] = useState(false);

  const changed = Object.entries(draftStock).filter(([id, qty]) => qty !== (ops.stock[id] ?? null));
  const lowChanged = draftLow !== undefined && (draftLow ?? 0) !== ops.lowStock;
  const dirty = changed.length > 0 || lowChanged;

  function save() {
    for (const [id, qty] of changed) setStock(id, qty);
    if (lowChanged) setLowStock(draftLow ?? 0);
    setDraftStock({});
    setDraftLow(undefined);
    setSaved(true);
  }
  const saveRef = useRef(save);
  saveRef.current = save;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  // Leaving the page with unsaved quantities asks first.
  useEffect(() => registerLeaveGuard(() => dirtyRef.current, { save: () => saveRef.current() }), []);
  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 2500);
    return () => window.clearTimeout(timer);
  }, [saved]);

  const products = content.products.filter((item) => !item.archived);
  const levelOf = (id: string) => stockLevel(ops.stock[id], ops.lowStock);
  const count = (level: StockLevel) => products.filter((item) => levelOf(item.id) === level).length;
  const needle = query.trim().toLowerCase();
  const rows = products.filter((item) => {
    if (filter !== "all" && levelOf(item.id) !== filter) return false;
    if (needle && ![item.nameAr, item.nameEn, item.categoryAr].some((text) => text.toLowerCase().includes(needle))) return false;
    return true;
  });

  const pager = usePager(rows, `${filter}|${query}`);

  return (
    <div className="space-y-6">
      <PageHead
        title="المخزون"
        lead="الكمية المتوفرة لكل منتج، مع تنبيه لما تقل عن الحد."
        actions={
          <>
            <div className="w-44">
              <NumberField
                label="حد التنبيه (قطع)"
                disabled={inShop}
                value={draftLow !== undefined ? draftLow : ops.lowStock}
                onChange={(value) => {
                  setSaved(false);
                  setDraftLow(value);
                }}
              />
            </div>
            <div className="flex items-center gap-2 self-end">
              {saved && !dirty ? <span className="text-xs font-medium text-(--a-ok)">تم الحفظ</span> : null}
              {dirty ? (
                <Button
                  onClick={() => {
                    setDraftStock({});
                    setDraftLow(undefined);
                  }}
                >
                  تراجع
                </Button>
              ) : null}
              <Button variant="primary" onClick={save} disabled={!dirty}>
                حفظ
              </Button>
            </div>
          </>
        }
      />
      <DemoNote title="تنبيه">
        الكميات محفوظة في قاعدة البيانات. طلبات المتجر ما زالت تتحفظ في هذا المتصفح، فما تنقص الكمية ولا توقف البيع عند النفاد لحد ربط صفحة الدفع بالخادم.
      </DemoNote>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="متوفر" value={num.format(count("ok"))} note={`أكثر من ${num.format(ops.lowStock)} قطع`} icon={PackageCheck} tone="ok" onClick={() => setFilter("ok")} />
        <StatCard label="منخفض" value={num.format(count("low"))} note={`${num.format(ops.lowStock)} قطع أو أقل`} icon={TriangleAlert} tone="warn" onClick={() => setFilter("low")} />
        <StatCard label="نفد" value={num.format(count("out"))} note="الكمية صفر" icon={PackageX} tone="danger" onClick={() => setFilter("out")} />
        <StatCard label="غير مسجّل" value={num.format(count("unset"))} note="ما فيه كمية محفوظة" icon={Boxes} tone="blue" onClick={() => setFilter("unset")} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={filter}
          onChange={setFilter}
          items={[
            ["all", "الكل", products.length],
            ["low", STOCK_LEVEL.low.label, count("low")],
            ["out", STOCK_LEVEL.out.label, count("out")],
            ["unset", STOCK_LEVEL.unset.label, count("unset")],
          ]}
        />
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
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.nameAr}</p>
                    <p className="mt-0.5 text-xs text-(--a-muted)">
                      {item.categoryAr}
                      {item.hidden ? " · مخفي في المتجر" : ""}
                    </p>
                  </div>
                  <Badge tone={level.tone}>{level.label}</Badge>
                  <div className="w-32">
                    <NumberField label={`كمية ${item.nameAr}`} hideLabel placeholder="—" suffix="قطعة" value={item.id in draftStock ? draftStock[item.id] : (ops.stock[item.id] ?? null)}
                      onChange={(value) => {
                        setSaved(false);
                        setDraftStock((current) => ({ ...current, [item.id]: value }));
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty icon={PackageSearch} title="ما فيه منتجات هنا" lead="غيّر الفلتر أو كلمة البحث." />
        )}
        <Pager pager={pager} />
      </Panel>
    </div>
  );
}
