import { useState } from "react";
import { CheckCircle2, Clock, Inbox, MapPin, PackageCheck, Plus, Trash2, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderDrawer, OrdersTable } from "./OrdersPage";
import { SHIP_STAGE, shipStage, useOps, type ShipStage, type ShippingMethod } from "./ops";
import type { Order } from "./orders";
import { Badge, Button, Confirm, DemoNote, Empty, IconButton, NumberField, PageHead, Panel, StatCard, Switch, Tabs, num, sar } from "./ui";

export function Shipping() {
  const { ops, orders, updateShipping, updateZone, addZone, removeZone } = useOps();
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(null);
  const [stage, setStage] = useState<Exclude<ShipStage, "cancelled">>("awaiting");
  const [viewing, setViewing] = useState<Order | null>(null);

  const count = (value: ShipStage) => orders.filter((order) => shipStage(order.status) === value).length;
  const rows = orders.filter((order) => shipStage(order.status) === stage);
  const activeMethods = ops.shipping.filter((item) => item.enabled).length;

  return (
    <div className="space-y-6">
      <PageHead title="الشحن والتوصيل" lead="طرق الشحن ورسومها ومناطق التوصيل، والطلبات حسب حالة الشحن." />
      <DemoNote title="بدون شركة شحن">
        غير مربوطة بأي شركة شحن، فالبوالص وأرقام التتبع ما تشتغل لسه. الرسوم والمناطق تتحفظ في قاعدة البيانات وتُطبَّق على صفحة إتمام الطلب لكل العملاء، والخادم يحسب بها إجمالي كل طلب.
      </DemoNote>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="بانتظار الشحن" value={num.format(count("awaiting"))} note="جديد أو قيد التجهيز" icon={Clock} tone="warn" onClick={() => setStage("awaiting")} />
        <StatCard label="تم الشحن" value={num.format(count("shipped"))} note="في الطريق للعميل" icon={Truck} tone="blue" onClick={() => setStage("shipped")} />
        <StatCard label="تم التسليم" value={num.format(count("delivered"))} note="وصلت للعميل" icon={PackageCheck} tone="ok" onClick={() => setStage("delivered")} />
        <StatCard label="طرق شحن مفعّلة" value={`${num.format(activeMethods)} / ${num.format(ops.shipping.length)}`} note="من الإعدادات أدناه" icon={CheckCircle2} tone="blue" />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold">طرق الشحن</h2>
          <p className="mt-1 text-sm text-(--a-muted)">شغّل أو أوقف أي طريقة، وحدد رسومها وحد الشحن المجاني والمناطق اللي تغطيها.</p>
        </div>
        <div className="grid gap-5 xl:grid-cols-3">
          {ops.shipping.map((method) => (
            <MethodCard
              key={method.id}
              method={method}
              zones={ops.zones}
              orders={orders.filter((order) => order.shippingMethod === method.id).length}
              onChange={(patch) => updateShipping(method.id, patch)}
            />
          ))}
        </div>
      </section>

      <Panel
        title="مناطق التوصيل"
        lead="المنطقة الموقوفة تختفي من كل طرق الشحن. المنطقة الجديدة تظهر للعميل بعد ما تضيفها لطريقة شحن من الكروت فوق."
        actions={
          <Button icon={Plus} onClick={addZone}>
            إضافة منطقة
          </Button>
        }
      >
        <ul className="divide-y divide-(--a-line)">
          {ops.zones.map((zone) => (
            <li key={zone.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", zone.enabled ? "bg-(--a-blue-soft) text-(--a-blue)" : "bg-(--a-surface-2) text-(--a-muted)")}>
                <MapPin className="size-5" />
              </span>
              <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                <input
                  value={zone.nameAr}
                  onChange={(event) => updateZone(zone.id, { nameAr: event.target.value })}
                  aria-label="اسم المنطقة"
                  className="h-10 rounded-xl border border-(--a-line) bg-(--a-bg) px-3 text-sm font-medium outline-none focus:border-(--a-accent)"
                />
                <input
                  value={zone.cities}
                  onChange={(event) => updateZone(zone.id, { cities: event.target.value })}
                  aria-label="المدن"
                  placeholder="المدن"
                  className="h-10 rounded-xl border border-(--a-line) bg-(--a-bg) px-3 text-sm outline-none placeholder:text-(--a-muted) focus:border-(--a-accent)"
                />
              </div>
              <span className="text-xs text-(--a-muted)">{num.format(orders.filter((order) => order.zone === zone.id).length)} طلب</span>
              <Switch size="sm" checked={zone.enabled} label={`تفعيل ${zone.nameAr}`} onChange={(enabled) => updateZone(zone.id, { enabled })} />
              {ops.zones.length > 1 ? (
                <IconButton icon={Trash2} tone="danger" label={`حذف ${zone.nameAr}`} onClick={() => setRemoving({ id: zone.id, name: zone.nameAr })} />
              ) : null}
            </li>
          ))}
        </ul>
      </Panel>
      <Confirm
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && removeZone(removing.id)}
        title={`حذف ${removing?.name ?? ""}؟`}
        lead="المنطقة تنحذف نهائيًا وتنشال من كل طرق الشحن، وما تظهر للعملاء. الطلبات القديمة تحتفظ باسم منطقتها، والعناوين المحفوظة عليها تحتاج يختار العميل منطقة ثانية."
        action="حذف المنطقة"
      />

      <Panel title="الطلبات حسب حالة الشحن" lead="افتح الطلب لتغيير طريقة شحنه أو حالته.">
        <div className="border-b border-(--a-line) px-5 py-3">
          <Tabs
            value={stage}
            onChange={setStage}
            items={[
              ["awaiting", SHIP_STAGE.awaiting.label, count("awaiting")],
              ["shipped", SHIP_STAGE.shipped.label, count("shipped")],
              ["delivered", SHIP_STAGE.delivered.label, count("delivered")],
            ]}
          />
        </div>
        {rows.length ? <OrdersTable orders={rows} onView={setViewing} /> : <Empty icon={Inbox} title="ما فيه طلبات هنا" lead="الطلبات تنتقل بين التبويبات حسب حالتها." />}
      </Panel>

      <OrderDrawer order={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

function MethodCard({
  method,
  zones,
  orders,
  onChange,
}: {
  method: ShippingMethod;
  zones: Array<{ id: string; nameAr: string; enabled: boolean }>;
  orders: number;
  onChange: (patch: Partial<ShippingMethod>) => void;
}) {
  const on = method.enabled;
  const eta =
    method.etaMax === 0
      ? "نفس اليوم"
      : method.etaMin === 0 || method.etaMin === method.etaMax
        ? `خلال ${num.format(method.etaMax)} ${method.etaMax === 1 ? "يوم" : "أيام"}`
        : `${num.format(method.etaMin)}–${num.format(method.etaMax)} أيام`;
  return (
    <article className={cn("flex flex-col overflow-hidden rounded-2xl border bg-(--a-surface) transition hover:shadow-(--a-shadow)", on ? "border-(--a-line)" : "border-dashed border-(--a-line)")}>
      <div className="flex items-center justify-between gap-3 border-b border-(--a-line) bg-(--a-surface-2)/40 px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", on ? "bg-(--a-blue-soft) text-(--a-blue)" : "bg-(--a-surface-2) text-(--a-muted)")}>
            <Truck className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold">{method.nameAr}</p>
            <p className="truncate text-xs text-(--a-muted)" dir="ltr">
              {method.nameEn}
            </p>
          </div>
        </div>
        <Switch checked={on} label={`تفعيل ${method.nameAr}`} onChange={(enabled) => onChange({ enabled })} />
      </div>

      <div className={cn("flex-1 space-y-4 p-5", on ? "" : "opacity-60")}>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge tone="blue">{method.fee ? sar.format(method.fee) : "مجاني"}</Badge>
          {method.freeOver ? <Badge tone="ok">مجاني فوق {sar.format(method.freeOver)}</Badge> : null}
          <Badge>{eta}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="رسوم الشحن" suffix="ر.س" value={method.fee} onChange={(value) => onChange({ fee: value ?? 0 })} />
          <NumberField label="مجاني عند" suffix="ر.س" placeholder="بدون" value={method.freeOver} onChange={(value) => onChange({ freeOver: value || null })} />
          <NumberField label="أقل مدة (أيام)" value={method.etaMin} onChange={(value) => onChange({ etaMin: value ?? 0 })} />
          <NumberField label="أطول مدة (أيام)" value={method.etaMax} onChange={(value) => onChange({ etaMax: value ?? 0 })} />
          <div className="col-span-2">
            <NumberField label="أقل مبلغ للطلب" suffix="ر.س" placeholder="بدون حد أدنى" value={method.minOrder} onChange={(value) => onChange({ minOrder: value || null })} />
          </div>
        </div>
        <fieldset>
          <legend className="mb-2 text-xs font-medium text-(--a-muted)">المناطق المشمولة</legend>
          <div className="flex flex-wrap gap-2">
            {zones.map((zone) => {
              const picked = method.zones.includes(zone.id);
              return (
                <button
                  key={zone.id}
                  type="button"
                  aria-pressed={picked}
                  disabled={!zone.enabled}
                  onClick={() => onChange({ zones: picked ? method.zones.filter((id) => id !== zone.id) : [...method.zones, zone.id] })}
                  className={cn(
                    "h-8 rounded-full border px-3 text-xs transition disabled:cursor-not-allowed disabled:opacity-40",
                    picked ? "border-(--a-blue)/50 bg-(--a-blue-soft) font-medium text-(--a-blue)" : "border-(--a-line) text-(--a-muted) hover:text-(--a-text)",
                  )}
                >
                  {zone.nameAr}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <div className="border-t border-(--a-line) px-5 py-3 text-xs text-(--a-muted)">{num.format(orders)} طلب على هذي الطريقة</div>
    </article>
  );
}
