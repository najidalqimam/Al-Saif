import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { ProductArt } from "@/components/site/card-art";
import { useShopRequests } from "../admin/shopScope";
import { AR_DATE, Badge, Empty, PageHead, Pager, Panel, sar, Tabs, usePager } from "../admin/ui";

/** The products this shop sent to the admin: waiting for approval, or refused with the reason. Read only. */
export function ShopRequests() {
  const requests = useShopRequests();
  const [tab, setTab] = useState<"pending" | "rejected">("pending");
  const pending = requests.filter((item) => item.approval === "pending");
  const rejected = requests.filter((item) => item.approval === "rejected");
  const rows = (tab === "pending" ? pending : rejected).slice().sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
  const pager = usePager(rows, tab);

  return (
    <div className="space-y-6">
      <PageHead title="طلبات المنتجات" lead="المنتجات اللي أرسلتها للإدارة. ما تظهر في المتجر إلا بعد الموافقة." />
      <Tabs value={tab} onChange={setTab} items={[["pending", "بانتظار الموافقة", pending.length], ["rejected", "مرفوضة", rejected.length]]} />
      <Panel>
        {rows.length ? (
          <ul className="divide-y divide-(--a-line)">
            {pager.rows.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-4 px-5 py-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-(--a-surface-2)">
                  <ProductArt id={item.id} className="size-10" />
                </span>
                <div className="min-w-48 flex-1">
                  <p className="font-medium">{item.nameAr}</p>
                  <p className="mt-0.5 text-xs text-(--a-muted)">
                    {item.categoryAr || "بدون قسم"}
                    {item.submittedAt ? ` · ${new Date(item.submittedAt).toLocaleDateString(AR_DATE, { day: "numeric", month: "short" })}` : ""}
                  </p>
                  {item.approval === "rejected" && item.rejectReason ? <p className="mt-1 text-xs text-(--a-danger)">سبب الرفض: {item.rejectReason}</p> : null}
                </div>
                <p className="font-semibold tabular-nums">{sar.format(item.price)}</p>
                <Badge tone={item.approval === "pending" ? "warn" : "danger"}>{item.approval === "pending" ? "قيد مراجعة الإدارة" : "مرفوض"}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <Empty icon={ClipboardCheck} title={tab === "pending" ? "ما فيه منتجات بانتظار الموافقة" : "ما فيه منتجات مرفوضة"} lead="المنتجات اللي تضيفها من «منتجاتي» تظهر هنا حتى توافق عليها الإدارة." />
        )}
        <Pager pager={pager} />
      </Panel>
    </div>
  );
}
