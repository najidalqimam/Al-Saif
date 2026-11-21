import { useEffect, useState } from "react";
import { ArrowRight, Check, ClipboardCheck, Pencil, X } from "lucide-react";
import { ProductArt } from "@/components/site/card-art";
import { useSiteContent, type ProductRow } from "@/lib/site-content";
import { onHashMove, pushHash, readHash } from "./nav";
import { AR_DATE, Badge, Button, Drawer, Empty, Field, num, PageHead, Pager, Panel, rowOpen, sar, Tabs, usePager } from "./ui";

/**
 * Products that shops sent from their own dashboard. Only the admin adds products straight from this dashboard; a shop's
 * product stays hidden from the store until the admin approves it here, or is refused with a reason the shop can read.
 */
export function ProductRequests() {
  const [sub, setSub] = useState(() => (readHash().view === "productRequests" ? readHash().sub : null));
  useEffect(() => onHashMove(() => setSub(readHash().view === "productRequests" ? readHash().sub : null)), []);
  return sub ? <RequestDetail id={sub} /> : <RequestsList />;
}

function RequestsList() {
  const { content, shops, approveProduct, rejectProduct } = useSiteContent();
  const [tab, setTab] = useState<"pending" | "rejected">("pending");
  const [refusing, setRefusing] = useState<ProductRow | null>(null);
  const [reason, setReason] = useState("");
  const pending = content.products.filter((item) => item.approval === "pending");
  const rejected = content.products.filter((item) => item.approval === "rejected");
  const rows = (tab === "pending" ? pending : rejected).slice().sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
  const pager = usePager(rows, tab);
  const shopName = (id: string | null | undefined) => (id ? (shops.find((item) => item.id === id)?.name ?? "محل غير معروف") : "بدون محل");

  return (
    <div className="space-y-6">
      <PageHead title="طلبات المنتجات" lead="المنتجات اللي أضافتها المحلات من لوحتها. ما تظهر في المتجر إلا بعد موافقتك." />
      <Tabs value={tab} onChange={setTab} items={[["pending", "بانتظار الموافقة", pending.length], ["rejected", "مرفوضة", rejected.length]]} />
      <Panel>
        {rows.length ? (
          <ul className="divide-y divide-(--a-line)">
            {pager.rows.map((item) => (
              <li key={item.id} {...rowOpen(() => pushHash("productRequests", item.id))} className="flex cursor-pointer flex-wrap items-center gap-4 px-5 py-3 transition hover:bg-(--a-surface-2)/40">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-(--a-surface-2)">
                  <ProductArt id={item.id} className="size-10" />
                </span>
                <div className="min-w-48 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {item.nameAr}
                    <Badge tone="blue">{shopName(item.shopId)}</Badge>
                  </p>
                  <p className="mt-0.5 text-xs text-(--a-muted)">
                    {item.categoryAr || "بدون قسم"}
                    {item.submittedAt ? ` · ${new Date(item.submittedAt).toLocaleDateString(AR_DATE, { day: "numeric", month: "short" })}` : ""}
                  </p>
                  {item.approval === "rejected" && item.rejectReason ? <p className="mt-1 text-xs text-(--a-danger)">سبب الرفض: {item.rejectReason}</p> : null}
                </div>
                <div className="text-end">
                  <p className="font-semibold tabular-nums">{sar.format(item.price)}</p>
                  {item.wholesalePrice ? <p className="text-xs text-(--a-muted)">جملة {sar.format(item.wholesalePrice)}</p> : null}
                </div>
                <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                  <Button icon={Pencil} onClick={() => pushHash("productRequests", item.id)}>
                    التفاصيل
                  </Button>
                  <Button variant="primary" icon={Check} onClick={() => approveProduct(item.id)}>
                    قبول
                  </Button>
                  {item.approval === "pending" ? (
                    <Button
                      icon={X}
                      onClick={() => {
                        setRefusing(item);
                        setReason("");
                      }}
                    >
                      رفض
                    </Button>
                  ) : (
                    <Badge tone="danger">مرفوض</Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty icon={ClipboardCheck} title={tab === "pending" ? "ما فيه طلبات بانتظار الموافقة" : "ما فيه منتجات مرفوضة"} lead={tab === "pending" ? "أي منتج تضيفه محل من لوحتها يظهر هنا لتراجعه." : "المنتجات اللي ترفضها تظهر هنا مع السبب، والمحل يشوفها في لوحته."} />
        )}
        <Pager pager={pager} />
      </Panel>
      <p className="text-xs text-(--a-muted)">{num.format(pending.length)} طلب بانتظار الموافقة. اضغط على أي طلب لفتح تفاصيله كاملة قبل ما توافق.</p>

      <Drawer
        open={refusing !== null}
        onClose={() => setRefusing(null)}
        title={refusing ? `رفض ${refusing.nameAr}` : ""}
        lead="اكتب سبب الرفض عشان المحل يعرف يصلّح ويرسله مرة ثانية."
        footer={
          <>
            <Button onClick={() => setRefusing(null)}>إلغاء</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (refusing) rejectProduct(refusing.id, reason);
                setRefusing(null);
              }}
              disabled={!reason.trim()}
            >
              تأكيد الرفض
            </Button>
          </>
        }
      >
        <Field label="سبب الرفض" value={reason} onChange={setReason} multiline />
      </Drawer>
    </div>
  );
}

/** One request in full: everything the shop entered, in the three languages, and the shop's details. */
function RequestDetail({ id }: { id: string }) {
  const { content, shops, approveProduct, rejectProduct } = useSiteContent();
  const [refusing, setRefusing] = useState(false);
  const [reason, setReason] = useState("");
  const item = content.products.find((row) => row.id === id) ?? null;
  const shop = item?.shopId ? shops.find((row) => row.id === item.shopId) : undefined;
  const back = () => pushHash("productRequests");

  if (!item) {
    return (
      <div className="space-y-6">
        <PageHead title="طلب المنتج" actions={<Button icon={ArrowRight} onClick={back}>كل الطلبات</Button>} />
        <Panel>
          <Empty icon={ClipboardCheck} title="ما لقينا هذا الطلب" lead="يمكن اتقبل أو انحذف. ارجع لقايمة الطلبات." />
        </Panel>
      </div>
    );
  }

  const pending = item.approval === "pending";
  const rows: Array<[string, string, string, string]> = [
    ["اسم المنتج", item.nameAr, item.nameEn, item.nameUr ?? ""],
    ["اسم القسم الظاهر على المنتج", item.categoryAr, item.categoryEn, item.categoryUr ?? ""],
    ["وصف المنتج", item.descriptionAr ?? "", item.descriptionEn ?? "", item.descriptionUr ?? ""],
  ];
  const lists: Array<[string, string[] | null | undefined]> = [
    ["عربي", item.featuresAr],
    ["English", item.featuresEn],
    ["اردو", item.featuresUr],
  ];
  const specLists: Array<[string, Array<{ label: string; value: string }> | null | undefined]> = [
    ["عربي", item.specsAr],
    ["English", item.specsEn],
    ["اردو", item.specsUr],
  ];

  return (
    <div className="space-y-6">
      <PageHead
        title={item.nameAr}
        lead={`طلب من ${shop?.name ?? "محل غير معروف"}${item.submittedAt ? ` · ${new Date(item.submittedAt).toLocaleDateString(AR_DATE, { day: "numeric", month: "long", year: "numeric" })}` : ""}`}
        actions={
          <>
            <Button icon={ArrowRight} onClick={back}>
              كل الطلبات
            </Button>
            <Button icon={Pencil} onClick={() => pushHash("products", `all/edit-${item.id}`)}>
              تعديل المنتج
            </Button>
            {pending ? (
              <Button icon={X} onClick={() => setRefusing(true)}>
                رفض
              </Button>
            ) : null}
            <Button
              variant="primary"
              icon={Check}
              onClick={() => {
                approveProduct(item.id);
                back();
              }}
            >
              قبول ونشر
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <Panel title="بيانات المنتج">
            <div className="divide-y divide-(--a-line)">
              {rows.map(([label, ar, en, ur]) => (
                <div key={label} className="grid gap-3 px-5 py-4 sm:grid-cols-[10rem_repeat(3,minmax(0,1fr))]">
                  <p className="text-xs font-medium text-(--a-muted)">{label}</p>
                  {[ar, en, ur].map((value, index) => (
                    <p key={index} dir={index === 1 ? "ltr" : "rtl"} className={value.trim() ? "text-sm leading-7" : "text-sm text-(--a-muted)"}>
                      {value.trim() || "—"}
                    </p>
                  ))}
                </div>
              ))}
              <div className="grid gap-3 px-5 py-4 sm:grid-cols-[10rem_repeat(3,minmax(0,1fr))]">
                <p className="text-xs font-medium text-(--a-muted)">القسم</p>
                <p className="text-sm sm:col-span-3">{item.categoryAr || "—"}</p>
              </div>
              <div className="grid gap-3 px-5 py-4 sm:grid-cols-[10rem_repeat(3,minmax(0,1fr))]">
                <p className="text-xs font-medium text-(--a-muted)">الأسعار</p>
                <p className="text-sm sm:col-span-3">
                  السعر <b className="tabular-nums">{sar.format(item.price)}</b>
                  {item.compareAt > item.price ? <> · قبل الخصم <s className="tabular-nums text-(--a-muted)">{sar.format(item.compareAt)}</s></> : null}
                  {item.wholesalePrice ? <> · جملة <b className="tabular-nums">{sar.format(item.wholesalePrice)}</b></> : null}
                </p>
              </div>
            </div>
          </Panel>

          <Panel title="صفحة المنتج" lead="اللي هيظهر للعميل في صفحة المنتج.">
            <div className="grid gap-6 p-5 sm:grid-cols-3">
              {lists.map(([label, list], index) => (
                <div key={label} dir={index === 1 ? "ltr" : "rtl"}>
                  <p className="mb-2 text-xs font-medium text-(--a-muted)">أبرز التفاصيل · {label}</p>
                  {list?.length ? (
                    <ul className="list-disc space-y-1 ps-5 text-sm leading-7">
                      {list.map((line, at) => (
                        <li key={at}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-(--a-muted)">—</p>
                  )}
                </div>
              ))}
            </div>
            <div className="grid gap-6 border-t border-(--a-line) p-5 sm:grid-cols-3">
              {specLists.map(([label, list], index) => (
                <div key={label} dir={index === 1 ? "ltr" : "rtl"}>
                  <p className="mb-2 text-xs font-medium text-(--a-muted)">المواصفات · {label}</p>
                  {list?.length ? (
                    <dl className="space-y-1 text-sm">
                      {list.map((row, at) => (
                        <div key={at} className="flex justify-between gap-3">
                          <dt className="text-(--a-muted)">{row.label}</dt>
                          <dd className="font-medium">{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-sm text-(--a-muted)">—</p>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <Panel title="الصورة">
            <div className="grid place-items-center p-5">
              <div className="grid w-full place-items-center rounded-2xl bg-(--a-surface-2) py-6">
                {item.image ? <img src={item.image} alt="" className="size-40 object-contain" /> : <span className="grid size-40 place-items-center rounded-2xl border border-dashed border-(--a-line) text-xs text-(--a-muted)">بدون صورة</span>}
              </div>
            </div>
          </Panel>
          <Panel title="الحالة">
            <div className="space-y-2 p-5 text-sm">
              <Badge tone={pending ? "warn" : "danger"}>{pending ? "بانتظار موافقتك" : "مرفوض"}</Badge>
              {item.rejectReason ? <p className="text-(--a-danger)">سبب الرفض: {item.rejectReason}</p> : null}
            </div>
          </Panel>
          <Panel title="المحل">
            <dl className="space-y-3 p-5 text-sm">
              {(
                [
                  ["المحل", shop?.name, undefined],
                  ["اسم المسؤول", shop?.ownerName, undefined],
                  ["الجوال", shop?.phone, "ltr"],
                  ["البريد الإلكتروني", shop?.email, "ltr"],
                  ["المدينة", shop?.city, undefined],
                  ["العنوان", shop?.address, undefined],
                ] as Array<[string, string | undefined, "ltr" | undefined]>
              ).map(([label, value, dir]) => (
                <div key={label}>
                  <dt className="text-xs text-(--a-muted)">{label}</dt>
                  <dd dir={dir} className={dir ? "mt-0.5 text-end font-medium" : "mt-0.5 font-medium"}>
                    {value?.trim() || "—"}
                  </dd>
                </div>
              ))}
              {shop ? (
                <Button onClick={() => pushHash("shops", shop.id)} className="w-full">
                  فتح صفحة المحل
                </Button>
              ) : null}
            </dl>
          </Panel>
        </div>
      </div>

      <Drawer
        open={refusing}
        onClose={() => setRefusing(false)}
        title={`رفض ${item.nameAr}`}
        lead="اكتب سبب الرفض عشان المحل يعرف يصلّح ويرسله مرة ثانية."
        footer={
          <>
            <Button onClick={() => setRefusing(false)}>إلغاء</Button>
            <Button
              variant="primary"
              onClick={() => {
                rejectProduct(item.id, reason);
                setRefusing(false);
                back();
              }}
              disabled={!reason.trim()}
            >
              تأكيد الرفض
            </Button>
          </>
        }
      >
        <Field label="سبب الرفض" value={reason} onChange={setReason} multiline />
      </Drawer>
    </div>
  );
}
