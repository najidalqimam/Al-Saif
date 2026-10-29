import { useState } from "react";
import { Boxes, PackageCheck, PackageSearch, PackageX, TriangleAlert } from "lucide-react";
import { ProductArt } from "@/components/site/card-art";
import { useSiteContent } from "@/lib/site-content";
import { STOCK_LEVEL, stockLevel, useOps, type StockLevel } from "./ops";
import { Badge, DemoNote, Empty, NumberField, PageHead, Panel, SearchBox, StatCard, Tabs, num } from "./ui";

type Filter = "all" | StockLevel;

export function Inventory() {
  const { content } = useSiteContent();
  const { ops, setStock, setLowStock } = useOps();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const products = content.products.filter((item) => !item.archived);
  const levelOf = (id: string) => stockLevel(ops.stock[id], ops.lowStock);
  const count = (level: StockLevel) => products.filter((item) => levelOf(item.id) === level).length;
  const needle = query.trim().toLowerCase();
  const rows = products.filter((item) => {
    if (filter !== "all" && levelOf(item.id) !== filter) return false;
    if (needle && ![item.nameAr, item.nameEn, item.categoryAr].some((text) => text.toLowerCase().includes(needle))) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHead
        title="المخزون"
        lead="سجّل الكمية المتوفرة لكل منتج، واللوحة تنبهك لما تقل عن الحد اللي تحدده."
        actions={
          <div className="w-44">
            <NumberField label="حد التنبيه (قطع)" value={ops.lowStock} onChange={(value) => setLowStock(value ?? 0)} />
          </div>
        }
      />
      <DemoNote title="مخزون محلي">
        الكميات تتحفظ على هذا الجهاز فقط وما تغيّر توفر المنتج في المتجر. ربط المخزون بالطلبات يتفعّل مع قاعدة البيانات.
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
            {rows.map((item) => {
              const level = STOCK_LEVEL[levelOf(item.id)];
              return (
                <li key={item.id} className="flex flex-wrap items-center gap-4 px-5 py-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-(--a-surface-2)">
                    <ProductArt id={item.id} className="size-9" />
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
                    <NumberField label={`كمية ${item.nameAr}`} hideLabel placeholder="—" suffix="قطعة" value={ops.stock[item.id] ?? null} onChange={(value) => setStock(item.id, value)} />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty icon={PackageSearch} title="ما فيه منتجات هنا" lead="غيّر الفلتر أو كلمة البحث." />
        )}
      </Panel>
    </div>
  );
}
