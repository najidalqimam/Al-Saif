import { BarChart3, LineChart, ReceiptText, Wallet } from "lucide-react";
import { ProductArt } from "@/components/site/card-art";
import { useSiteContent } from "@/lib/site-content";
import { PAYMENT_LABELS, useOps } from "./ops";
import { ORDER_STATUS, type OrderStatus } from "./orders";
import { Badge, Empty, PageHead, Panel, StatCard, num, sar } from "./ui";

export function Reports() {
  const { content } = useSiteContent();
  const { orders, ops } = useOps();
  const kept = orders.filter((order) => order.status !== "cancelled");
  const sales = kept.reduce((sum, order) => sum + order.total, 0);
  const average = kept.length ? Math.round(sales / kept.length) : 0;
  const units = kept.reduce((sum, order) => sum + order.items, 0);

  const byProduct = Object.entries(
    kept.reduce<Record<string, { units: number; total: number }>>((map, order) => {
      const row = (map[order.productId] ??= { units: 0, total: 0 });
      row.units += order.items;
      row.total += order.total;
      return map;
    }, {}),
  ).sort((a, b) => b[1].total - a[1].total);
  const topTotal = byProduct[0]?.[1].total ?? 1;

  const byMethod = (["cod", "bank"] as const).map((id) => ({ id, total: kept.filter((order) => order.paymentMethod === id).reduce((sum, order) => sum + order.total, 0) }));
  const byZone = ops.zones.map((zone) => ({ ...zone, count: kept.filter((order) => order.zone === zone.id).length }));
  const nameOf = (id: string) => content.products.find((item) => item.id === id)?.nameAr ?? id;

  return (
    <div className="space-y-6">
      <PageHead title="التقارير" lead="ملخص المبيعات حسب المنتج وطريقة الدفع والمنطقة." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="صافي المبيعات" value={sar.format(sales)} note="بدون الطلبات الملغية" icon={Wallet} tone="blue" />
        <StatCard label="متوسط قيمة الطلب" value={sar.format(average)} note={`من ${num.format(kept.length)} طلب`} icon={ReceiptText} tone="blue" />
        <StatCard label="القطع المباعة" value={num.format(units)} note="مجموع الكميات" icon={BarChart3} tone="ok" />
        <StatCard label="الطلبات الملغية" value={num.format(orders.length - kept.length)} note="غير محسوبة في المبيعات" icon={LineChart} tone="warn" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="الأكثر مبيعًا" lead="حسب قيمة المبيعات">
          {byProduct.length ? (
            <ul className="space-y-4 p-5">
              {byProduct.map(([id, row]) => (
                <li key={id} className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-(--a-surface-2)">
                    <ProductArt id={id} className="size-8" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium">{nameOf(id)}</span>
                      <span className="shrink-0 tabular-nums">{sar.format(row.total)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-(--a-surface-2)">
                      <div className="h-full rounded-full bg-(--a-blue)" style={{ width: `${(row.total / topTotal) * 100}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-(--a-muted)">{num.format(row.units)} قطعة</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon={BarChart3} title="ما فيه مبيعات" lead="أول طلب مكتمل يظهر هنا." />
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="حسب طريقة الدفع">
            <ul className="divide-y divide-(--a-line)">
              {byMethod.map((row) => (
                <li key={row.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                  <span>{PAYMENT_LABELS[row.id].ar}</span>
                  <span className="font-semibold tabular-nums">{sar.format(row.total)}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="حسب المنطقة">
            <ul className="divide-y divide-(--a-line)">
              {byZone.map((zone) => (
                <li key={zone.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                  <span>{zone.nameAr}</span>
                  <span className="font-semibold tabular-nums">{num.format(zone.count)} طلب</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel title="الطلبات حسب الحالة">
        <div className="grid grid-cols-2 gap-px bg-(--a-line) sm:grid-cols-5">
          {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((id) => (
            <div key={id} className="bg-(--a-surface) px-5 py-4">
              <Badge tone={ORDER_STATUS[id].tone}>{ORDER_STATUS[id].label}</Badge>
              <p className="mt-2 text-xl font-bold tabular-nums">{num.format(orders.filter((order) => order.status === id).length)}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
