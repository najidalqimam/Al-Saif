import { useState } from "react";
import { Banknote, CircleDollarSign, CreditCard, Inbox, Landmark, ShieldCheck, Undo2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderDrawer, OrdersTable } from "./OrdersPage";
import { PAYMENT_LABELS, PAYMENT_STATUS, useOps, type PaymentMethod, type PaymentMethodId } from "./ops";
import type { Order, PaymentStatus } from "./orders";
import { Badge, DemoNote, Empty, Field, NumberField, PageHead, Panel, Select, StatCard, Switch, Tabs, num, sar, type IconType } from "./ui";

const METHOD_ICONS: Record<PaymentMethodId, IconType> = { cod: Banknote, bank: Landmark, online: CreditCard };

export function Payments() {
  const { ops, orders, updatePayment, updateBank } = useOps();
  const [status, setStatus] = useState<"all" | PaymentStatus>("all");
  const [method, setMethod] = useState<"all" | Order["paymentMethod"]>("all");
  const [viewing, setViewing] = useState<Order | null>(null);

  const byStatus = (value: PaymentStatus) => orders.filter((order) => order.paymentStatus === value);
  const total = (list: Order[]) => list.reduce((sum, order) => sum + order.total, 0);
  const rows = orders.filter((order) => (status === "all" || order.paymentStatus === status) && (method === "all" || order.paymentMethod === method));

  return (
    <div className="space-y-6">
      <PageHead title="المدفوعات" lead="طرق الدفع المتاحة للعميل وحالة دفع الطلبات." />
      <DemoNote title="ما فيه بوابة دفع مربوطة">
        الدفع الإلكتروني موقوف حتى نربط مزود دفع حقيقي. الإعدادات هنا محلية على هذا الجهاز، واللوحة ما تطلب ولا تحفظ أرقام بطاقات أو كلمات سر أو مفاتيح سرية.
      </DemoNote>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="بانتظار الدفع" value={num.format(byStatus("pending").length)} note={sar.format(total(byStatus("pending")))} icon={CircleDollarSign} tone="warn" demo onClick={() => setStatus("pending")} />
        <StatCard label="مدفوع" value={num.format(byStatus("paid").length)} note={sar.format(total(byStatus("paid")))} icon={ShieldCheck} tone="ok" demo onClick={() => setStatus("paid")} />
        <StatCard label="فشل الدفع" value={num.format(byStatus("failed").length)} note={sar.format(total(byStatus("failed")))} icon={XCircle} tone="danger" demo onClick={() => setStatus("failed")} />
        <StatCard label="مسترجع" value={num.format(byStatus("refunded").length)} note={sar.format(total(byStatus("refunded")))} icon={Undo2} tone="blue" demo onClick={() => setStatus("refunded")} />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold">طرق الدفع</h2>
          <p className="mt-1 text-sm text-(--a-muted)">الطريقة الموقوفة ما تظهر للعميل عند الدفع بعد الربط.</p>
        </div>
        <div className="grid gap-5 xl:grid-cols-3">
          {ops.payments.map((item) => (
            <MethodCard key={item.id} method={item} orders={orders.filter((order) => order.paymentMethod === item.id).length} onChange={(patch) => updatePayment(item.id, patch)}>
              {item.id === "bank" ? (
                <div className="space-y-3">
                  <Field label="اسم البنك" value={ops.bank.bankName} onChange={(bankName) => updateBank({ bankName })} placeholder="مثال: البنك الأهلي" />
                  <Field label="اسم صاحب الحساب" value={ops.bank.holder} onChange={(holder) => updateBank({ holder })} placeholder="اسم المؤسسة كما في البنك" />
                  <Field label="رقم الآيبان" value="" onChange={() => {}} placeholder="يُضاف من قاعدة البيانات بعد الربط" disabled />
                </div>
              ) : null}
              {item.id === "online" ? <ProviderPlaceholder /> : null}
            </MethodCard>
          ))}
        </div>
      </section>

      <Panel title="حالة دفع الطلبات" lead="طلبات تجريبية. افتح الطلب لتغيير حالة الدفع." actions={<Badge tone="blue">تجريبي</Badge>}>
        <div className="flex flex-wrap items-center gap-3 border-b border-(--a-line) px-5 py-3">
          <Tabs<"all" | PaymentStatus>
            value={status}
            onChange={setStatus}
            items={[["all", "الكل", orders.length], ...(Object.keys(PAYMENT_STATUS) as PaymentStatus[]).map((id): [PaymentStatus, string, number] => [id, PAYMENT_STATUS[id].label, byStatus(id).length])]}
          />
          <div className="w-full sm:ms-auto sm:w-52">
            <Select
              label="طريقة الدفع"
              hideLabel
              value={method}
              onChange={setMethod}
              options={[
                ["all", "كل طرق الدفع"],
                ["cod", PAYMENT_LABELS.cod.ar],
                ["bank", PAYMENT_LABELS.bank.ar],
              ]}
            />
          </div>
        </div>
        {rows.length ? <OrdersTable orders={rows} onView={setViewing} /> : <Empty icon={Inbox} title="ما فيه طلبات بهذي الحالة" lead="غيّر الفلتر لعرض طلبات ثانية." />}
      </Panel>

      <OrderDrawer order={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

function MethodCard({ method, orders, onChange, children }: { method: PaymentMethod; orders: number; onChange: (patch: Partial<PaymentMethod>) => void; children?: React.ReactNode }) {
  const Icon = METHOD_ICONS[method.id];
  const label = PAYMENT_LABELS[method.id];
  const locked = method.id === "online";
  const on = method.enabled;
  return (
    <article className={cn("flex flex-col overflow-hidden rounded-2xl border bg-(--a-surface) transition hover:shadow-(--a-shadow)", on ? "border-(--a-line)" : "border-dashed border-(--a-line)")}>
      <div className="flex items-center justify-between gap-3 border-b border-(--a-line) bg-(--a-surface-2)/40 px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", on ? "bg-(--a-accent-soft) text-(--a-accent-ink)" : "bg-(--a-surface-2) text-(--a-muted)")}>
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold">{label.ar}</p>
            <p className="truncate text-xs text-(--a-muted)" dir="ltr">
              {label.en}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {locked ? <Badge tone="warn">غير مربوط</Badge> : null}
          <Switch checked={on} disabled={locked} label={locked ? "يحتاج ربط بوابة دفع" : `تفعيل ${label.ar}`} onChange={(enabled) => onChange({ enabled })} />
        </div>
      </div>
      <div className="flex-1 space-y-4 p-5">
        <p className="text-sm leading-7 text-(--a-muted)">{label.lead}</p>
        {locked ? null : <NumberField label="رسوم إضافية على العميل" suffix="ر.س" value={method.fee} onChange={(value) => onChange({ fee: value ?? 0 })} />}
        {children}
      </div>
      <div className="border-t border-(--a-line) px-5 py-3 text-xs text-(--a-muted)">{locked ? "ما فيه طلبات، الطريقة غير متاحة" : `${num.format(orders)} طلب تجريبي بهذي الطريقة`}</div>
    </article>
  );
}

function ProviderPlaceholder() {
  return (
    <div className="space-y-3 rounded-xl border border-dashed border-(--a-line) p-4">
      <p className="text-xs font-semibold">إعداد مزود الدفع</p>
      <Select label="المزود" value="none" onChange={() => {}} options={[["none", "لم يُربط مزود بعد"]]} disabled />
      <Field label="المفتاح العام (Publishable key)" value="" onChange={() => {}} placeholder="يُضاف من الخادم وقت الربط" dir="ltr" disabled />
      <p className="text-xs leading-6 text-(--a-muted)">المفاتيح السرية تبقى على الخادم فقط، وما تنحفظ في المتصفح أو في كود الموقع.</p>
    </div>
  );
}
