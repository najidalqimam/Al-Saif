import { useState } from "react";
import { CircleDollarSign, Inbox, ShieldCheck, Undo2, XCircle } from "lucide-react";
import { OrdersTable, openOrder } from "../admin/OrdersPage";
import { PAYMENT_LABELS, PAYMENT_STATUS } from "../admin/ops";
import { useOps } from "../admin/ops";
import type { Order, PaymentStatus } from "../admin/orders";
import { useShopScope } from "../admin/shopScope";
import { Empty, PageHead, Panel, Select, StatCard, Tabs, num, sar } from "../admin/ui";
import { ShopPaymentMethods } from "./ShopPaymentMethods";

/** Payment status of the orders that contain this shop's products. The payment methods themselves are set by the store. */
export function ShopPayments() {
  const { orders } = useOps();
  const shopId = useShopScope();
  const [status, setStatus] = useState<"all" | PaymentStatus>("all");
  const [method, setMethod] = useState<"all" | Order["paymentMethod"]>("all");

  const byStatus = (value: PaymentStatus) => orders.filter((order) => order.paymentStatus === value);
  const total = (list: Order[]) => list.reduce((sum, order) => sum + order.total, 0);
  const rows = orders.filter((order) => (status === "all" || order.paymentStatus === status) && (method === "all" || order.paymentMethod === method));

  return (
    <div className="space-y-6">
      <PageHead title="المدفوعات" lead="طرق الدفع وبيانات بنكك، وحالة دفع الطلبات اللي فيها منتجات من محلك." />
      {shopId ? <ShopPaymentMethods shopId={shopId} /> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="بانتظار الدفع" value={num.format(byStatus("pending").length)} note={sar.format(total(byStatus("pending")))} icon={CircleDollarSign} tone="warn" onClick={() => setStatus("pending")} />
        <StatCard label="مدفوع" value={num.format(byStatus("paid").length)} note={sar.format(total(byStatus("paid")))} icon={ShieldCheck} tone="ok" onClick={() => setStatus("paid")} />
        <StatCard label="فشل الدفع" value={num.format(byStatus("failed").length)} note={sar.format(total(byStatus("failed")))} icon={XCircle} tone="danger" onClick={() => setStatus("failed")} />
        <StatCard label="مسترجع" value={num.format(byStatus("refunded").length)} note={sar.format(total(byStatus("refunded")))} icon={Undo2} tone="blue" onClick={() => setStatus("refunded")} />
      </div>
      <Panel title="طلبات محلك حسب الدفع" lead="افتح الطلب لمعرفة تفاصيله.">
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
        {rows.length ? <OrdersTable orders={rows} onView={openOrder} /> : <Empty icon={Inbox} title="ما فيه طلبات بهذي الحالة" lead="غيّر الفلتر لعرض طلبات ثانية." />}
      </Panel>
    </div>
  );
}
