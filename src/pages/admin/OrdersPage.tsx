import { useState } from "react";
import { Eye, Inbox, X } from "lucide-react";
import { ProductArt } from "@/components/site/card-art";
import { useSiteContent } from "@/lib/site-content";
import { PAYMENT_LABELS, PAYMENT_STATUS, SHIP_STAGE, shipStage, useOps, type ShipStage } from "./ops";
import { readHash } from "./nav";
import { ORDER_STATUS, type Order, type OrderStatus, type PaymentStatus } from "./orders";
import { AR_DATE, Badge, Button, Drawer, Empty, IconButton, PageHead, Panel, SearchBox, Select, Tabs, num, sar } from "./ui";

export const shortDate = (date: string) => new Date(date).toLocaleDateString(AR_DATE, { day: "numeric", month: "short" });

export function OrdersTable({ orders, onView, compact }: { orders: Order[]; onView: (order: Order) => void; compact?: boolean }) {
  const { content } = useSiteContent();
  const { ops } = useOps();
  const nameOf = (id: string) => content.products.find((item) => item.id === id)?.nameAr ?? id;
  const methodOf = (id: string) => ops.shipping.find((item) => item.id === id)?.nameAr ?? "—";
  const head = "px-4 py-2.5 text-start text-xs font-medium whitespace-nowrap text-(--a-muted) first:ps-5 last:pe-5";
  const cell = "px-4 py-2.5 first:ps-5 last:pe-5";

  return (
    <div className="relative overflow-x-auto">
      <table className={compact ? "w-full min-w-[680px] text-sm" : "w-full min-w-[920px] text-sm"}>
        <thead className="bg-(--a-surface-2)/50">
          <tr>
            <th className={head}>الطلب</th>
            <th className={head}>العميل</th>
            <th className={head}>المنتج</th>
            <th className={head}>المبلغ</th>
            {compact ? null : <th className={head}>الدفع</th>}
            {compact ? null : <th className={head}>الشحن</th>}
            <th className={head}>الحالة</th>
            <th className={head}>
              <span className="sr-only">إجراءات</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const status = ORDER_STATUS[order.status];
            const payment = PAYMENT_STATUS[order.paymentStatus];
            return (
              <tr key={order.id} className="border-t border-(--a-line) transition-colors hover:bg-(--a-surface-2)/40">
                <td className={cell}>
                  <p className="font-semibold tabular-nums" dir="ltr">
                    #{order.id}
                  </p>
                  <p className="text-xs text-(--a-muted)">{shortDate(order.date)}</p>
                  {order.source === "store" ? (
                    <span className="mt-1 inline-block">
                      <Badge tone="ok">من المتجر</Badge>
                    </span>
                  ) : null}
                </td>
                <td className={cell}>
                  <p className="font-medium whitespace-nowrap">{order.customer}</p>
                  <p className="text-xs text-(--a-muted)">{order.city}</p>
                </td>
                <td className={cell}>
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-(--a-surface-2)">
                      <ProductArt id={order.productId} className="size-7" />
                    </span>
                    <span className="line-clamp-1">
                      {nameOf(order.productId)}
                      {order.lines && order.lines.length > 1 ? (
                        <span className="text-(--a-muted)"> +{num.format(order.lines.length - 1)}</span>
                      ) : order.items > 1 ? (
                        <span className="text-(--a-muted)"> ×{num.format(order.items)}</span>
                      ) : null}
                    </span>
                  </div>
                </td>
                <td className={`${cell} font-medium whitespace-nowrap tabular-nums`}>{sar.format(order.total)}</td>
                {compact ? null : (
                  <td className={cell}>
                    <p className="text-xs whitespace-nowrap text-(--a-muted)">{PAYMENT_LABELS[order.paymentMethod].ar}</p>
                    <span className="mt-1 inline-block">
                      <Badge tone={payment.tone}>{payment.label}</Badge>
                    </span>
                  </td>
                )}
                {compact ? null : <td className={`${cell} whitespace-nowrap`}>{methodOf(order.shippingMethod)}</td>}
                <td className={cell}>
                  <Badge tone={status.tone}>
                    <span className="size-1.5 rounded-full bg-current" />
                    {status.label}
                  </Badge>
                </td>
                <td className={`${cell} text-end`}>
                  <IconButton icon={Eye} label={`عرض الطلب ${order.id}`} onClick={() => onView(order)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Order details with local edits for status, shipping method and payment status. */
export function OrderDrawer({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const { content } = useSiteContent();
  const { ops, orders, updateOrder } = useOps();
  const current = order ? (orders.find((item) => item.id === order.id) ?? order) : null;
  const product = current ? content.products.find((item) => item.id === current.productId) : null;
  const zone = current ? ops.zones.find((item) => item.id === current.zone) : null;

  return (
    <Drawer
      open={current !== null}
      onClose={onClose}
      title={current ? `الطلب #${current.id}` : ""}
      lead={
        current?.source === "store"
          ? "طلب من المتجر. تغيير الحالة يظهر للعميل في صفحة تتبع الطلب على هذا المتصفح."
          : "طلب تجريبي. التعديلات تتحفظ على هذا الجهاز فقط وما توصل للعميل."
      }
      footer={
        <Button variant="primary" onClick={onClose}>
          تم
        </Button>
      }
    >
      {current ? (
        <div className="space-y-5">
          {current.lines?.length ? (
            <div className="rounded-2xl border border-(--a-line)">
              <ul className="divide-y divide-(--a-line)">
                {current.lines.map((line) => (
                  <li key={line.id} className="flex items-center gap-3 p-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-(--a-surface-2)">
                      <ProductArt id={line.id} className="size-10" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold">{line.name}</p>
                      <p className="text-xs text-(--a-muted)">
                        {num.format(line.qty)} × {sar.format(line.price)}
                      </p>
                    </div>
                    <p className="font-semibold tabular-nums">{sar.format(line.qty * line.price)}</p>
                  </li>
                ))}
              </ul>
              <dl className="space-y-1.5 border-t border-(--a-line) p-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-(--a-muted)">المنتجات</dt>
                  <dd className="tabular-nums">{sar.format(current.subtotal ?? current.total)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-(--a-muted)">الشحن</dt>
                  <dd className="tabular-nums">{current.shippingFee ? sar.format(current.shippingFee) : "مجاني"}</dd>
                </div>
                {current.paymentFee ? (
                  <div className="flex justify-between">
                    <dt className="text-(--a-muted)">رسوم الدفع</dt>
                    <dd className="tabular-nums">{sar.format(current.paymentFee)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-(--a-line) pt-2 text-base font-bold">
                  <dt>الإجمالي</dt>
                  <dd className="tabular-nums">{sar.format(current.total)}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="flex items-center gap-4 rounded-2xl border border-(--a-line) p-4">
              <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-(--a-surface-2)">
                <ProductArt id={current.productId} className="size-12" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{product?.nameAr ?? current.productId}</p>
                <p className="text-sm text-(--a-muted)">الكمية {num.format(current.items)}</p>
              </div>
              <p className="text-lg font-bold tabular-nums">{sar.format(current.total)}</p>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-(--a-surface-2)/60 p-4 text-sm">
            <dt className="text-(--a-muted)">العميل</dt>
            <dd className="font-medium">{current.customer}</dd>
            <dt className="text-(--a-muted)">المدينة</dt>
            <dd>
              {current.city} · {zone?.nameAr ?? "—"}
            </dd>
            <dt className="text-(--a-muted)">التاريخ</dt>
            <dd>{shortDate(current.date)}</dd>
            <dt className="text-(--a-muted)">طريقة الدفع</dt>
            <dd>{PAYMENT_LABELS[current.paymentMethod].ar}</dd>
            {current.phone ? (
              <>
                <dt className="text-(--a-muted)">الجوال</dt>
                <dd dir="ltr" className="text-end tabular-nums">
                  {current.phone}
                </dd>
              </>
            ) : null}
            {current.email ? (
              <>
                <dt className="text-(--a-muted)">البريد</dt>
                <dd dir="ltr" className="truncate text-end">
                  {current.email}
                </dd>
              </>
            ) : null}
            {current.address ? (
              <>
                <dt className="text-(--a-muted)">العنوان</dt>
                <dd>{current.address}</dd>
              </>
            ) : null}
            {current.notes ? (
              <>
                <dt className="text-(--a-muted)">ملاحظات</dt>
                <dd>{current.notes}</dd>
              </>
            ) : null}
          </dl>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select<OrderStatus>
              label="حالة الطلب"
              value={current.status}
              onChange={(status) => updateOrder(current.id, { status })}
              options={(Object.keys(ORDER_STATUS) as OrderStatus[]).map((id) => [id, ORDER_STATUS[id].label])}
            />
            <Select<PaymentStatus>
              label="حالة الدفع"
              value={current.paymentStatus}
              onChange={(paymentStatus) => updateOrder(current.id, { paymentStatus })}
              options={(Object.keys(PAYMENT_STATUS) as PaymentStatus[]).map((id) => [id, PAYMENT_STATUS[id].label])}
            />
            <div className="sm:col-span-2">
              <Select
                label="طريقة الشحن"
                value={current.shippingMethod}
                onChange={(shippingMethod) => updateOrder(current.id, { shippingMethod })}
                options={ops.shipping.map((item) => [item.id, item.enabled ? item.nameAr : `${item.nameAr} (موقوفة)`])}
              />
            </div>
          </div>
          <p className="text-xs leading-6 text-(--a-muted)">بوليصة الشحن ورقم التتبع يتفعّلون بعد ربط شركة شحن. حاليًا ما فيه ربط مع أي مزود.</p>
        </div>
      ) : null}
    </Drawer>
  );
}

type ShipFilter = "all" | ShipStage;

export function Orders({ initialShip = "all" }: { initialShip?: ShipFilter }) {
  const { orders, ops } = useOps();
  const [ship, setShip] = useState<ShipFilter>(initialShip);
  const [payMethod, setPayMethod] = useState<"all" | Order["paymentMethod"]>("all");
  const [payStatus, setPayStatus] = useState<"all" | PaymentStatus>("all");
  const [method, setMethod] = useState("all");
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<Order | null>(null);
  // "New orders" from the overview's quick actions arrives as #orders/new.
  const [onlyNew, setOnlyNew] = useState(() => readHash().view === "orders" && readHash().sub === "new");

  const count = (stage: ShipStage) => orders.filter((order) => shipStage(order.status) === stage).length;
  const needle = query.trim();
  const rows = orders.filter((order) => {
    if (onlyNew && order.status !== "new") return false;
    if (ship !== "all" && shipStage(order.status) !== ship) return false;
    if (payMethod !== "all" && order.paymentMethod !== payMethod) return false;
    if (payStatus !== "all" && order.paymentStatus !== payStatus) return false;
    if (method !== "all" && order.shippingMethod !== method) return false;
    if (needle && ![order.id, order.customer, order.city].some((text) => text.includes(needle))) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHead title="الطلبات" lead="حالة كل طلب وطريقة دفعه وشحنه. «من المتجر» = طلب من صفحة إتمام الطلب." />
      {onlyNew ? (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-(--a-muted)">عرض:</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-(--a-blue)/40 bg-(--a-blue-soft) py-1 ps-3 pe-1 font-medium text-(--a-blue)">
            الطلبات الجديدة فقط
            <button type="button" onClick={() => setOnlyNew(false)} aria-label="عرض كل الطلبات" className="grid size-6 place-items-center rounded-full hover:bg-(--a-blue-soft)">
              <X className="size-3.5" />
            </button>
          </span>
        </p>
      ) : null}

      <div className="space-y-3">
        <Tabs
          value={ship}
          onChange={setShip}
          items={[
            ["all", "الكل", orders.length],
            ["awaiting", SHIP_STAGE.awaiting.label, count("awaiting")],
            ["shipped", SHIP_STAGE.shipped.label, count("shipped")],
            ["delivered", SHIP_STAGE.delivered.label, count("delivered")],
            ["cancelled", SHIP_STAGE.cancelled.label, count("cancelled")],
          ]}
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <SearchBox value={query} onChange={setQuery} placeholder="ابحث برقم الطلب أو اسم العميل" />
          <Select
            label="طريقة الدفع"
            hideLabel
            value={payMethod}
            onChange={setPayMethod}
            options={[
              ["all", "كل طرق الدفع"],
              ["cod", PAYMENT_LABELS.cod.ar],
              ["bank", PAYMENT_LABELS.bank.ar],
            ]}
          />
          <Select<"all" | PaymentStatus>
            label="حالة الدفع"
            hideLabel
            value={payStatus}
            onChange={setPayStatus}
            options={[["all", "كل حالات الدفع"], ...(Object.keys(PAYMENT_STATUS) as PaymentStatus[]).map((id): [PaymentStatus, string] => [id, PAYMENT_STATUS[id].label])]}
          />
          <Select label="طريقة الشحن" hideLabel value={method} onChange={setMethod} options={[["all", "كل طرق الشحن"], ...ops.shipping.map((item): [string, string] => [item.id, item.nameAr])]} />
        </div>
      </div>

      <Panel>
        {rows.length ? (
          <OrdersTable orders={rows} onView={setViewing} />
        ) : (
          <Empty icon={Inbox} title="ما فيه طلبات بهذي الفلاتر" lead="غيّر الفلتر أو امسح البحث لعرض كل الطلبات." />
        )}
      </Panel>

      <OrderDrawer order={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
