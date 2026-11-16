import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Phone } from "lucide-react";
import { INQUIRIES_KEY, inquiryId, loadInquiries, statusOf, updateInquiry, type InquiryStatus, type SetupInquiry } from "@/lib/setup-inquiries";
import { AR_DATE, Badge, Button, DemoNote, Drawer, Empty, Field, PageHead, Pager, Panel, Select, Tabs, usePager } from "./ui";

const STATUS: Record<InquiryStatus, { label: string; tone: "blue" | "warn" | "ok" }> = {
  new: { label: "جديد", tone: "blue" },
  contacting: { label: "قيد التواصل", tone: "warn" },
  done: { label: "تم", tone: "ok" },
};
const STATUS_OPTIONS: Array<[InquiryStatus, string]> = (Object.keys(STATUS) as InquiryStatus[]).map((id) => [id, STATUS[id].label]);

const formatTime = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString(AR_DATE, { dateStyle: "medium", timeStyle: "short" });
};

/** "Ask us to prepare your order" requests sent from the storefront form: list, open, set the status, keep internal notes. */
export function SetupRequests() {
  const [rows, setRows] = useState<SetupInquiry[]>(() => loadInquiries());
  const [filter, setFilter] = useState<"all" | InquiryStatus>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [status, setStatus] = useState<InquiryStatus>("new");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  // Requests sent from another tab of this browser show up without a refresh.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === INQUIRIES_KEY || event.key === null) setRows(loadInquiries());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const counts = useMemo(() => {
    const result = { new: 0, contacting: 0, done: 0 };
    for (const row of rows) result[statusOf(row)] += 1;
    return result;
  }, [rows]);
  const shown = filter === "all" ? rows : rows.filter((row) => statusOf(row) === filter);
  const pager = usePager(shown, filter);
  const open = openId ? rows.find((row) => inquiryId(row) === openId) : undefined;

  function show(row: SetupInquiry) {
    setOpenId(inquiryId(row));
    setStatus(statusOf(row));
    setNotes(row.adminNotes ?? "");
    setError("");
  }

  function save() {
    if (!open) return;
    if (!updateInquiry(inquiryId(open), { status, adminNotes: notes.trim() })) {
      setError("تعذّر حفظ التغيير في هذا المتصفح. حاول مرة ثانية.");
      return;
    }
    setRows(loadInquiries());
    setOpenId(null);
  }

  return (
    <div className="space-y-6">
      <PageHead title="طلبات التجهيز" lead="الطلبات اللي أرسلها العملاء من فورم «اطلب تجهيز طلبك». غيّر حالة الطلب واكتب ملاحظاتك الداخلية." />
      <DemoNote title="معاينة محلية">
        طلبات التجهيز تتحفظ في المتصفح اللي أرسل منه العميل فقط، وليست طلبات وصلت للسيرفر. ما تظهر هنا من جهاز أو متصفح ثاني، وتختفي لو انمسح تخزين المتصفح.
      </DemoNote>

      {rows.length > 0 ? (
        <Tabs
          value={filter}
          onChange={setFilter}
          items={[
            ["all", "الكل", rows.length],
            ["new", STATUS.new.label, counts.new],
            ["contacting", STATUS.contacting.label, counts.contacting],
            ["done", STATUS.done.label, counts.done],
          ]}
        />
      ) : null}

      <Panel>
        {rows.length === 0 ? (
          <Empty icon={ClipboardList} title="ما فيه طلبات تجهيز بعد" lead="لما يرسل عميل طلب من فورم «اطلب تجهيز طلبك» في المتجر، يظهر هنا." />
        ) : shown.length === 0 ? (
          <Empty icon={ClipboardList} title="ما فيه طلبات بهذي الحالة" lead="غيّر الفلتر لعرض باقي الطلبات." />
        ) : (
          <ul className="divide-y divide-(--a-line)">
            {pager.rows.map((row) => {
              const current = STATUS[statusOf(row)];
              return (
                <li key={inquiryId(row)}>
                  <button type="button" onClick={() => show(row)} className="flex w-full items-start gap-3 px-5 py-3.5 text-start transition hover:bg-(--a-surface-2)">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--a-surface-2) text-(--a-muted)">
                      <ClipboardList className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-medium">{row.name}</span>
                        <span dir="ltr" className="inline-flex items-center gap-1 text-sm text-(--a-muted)">
                          <Phone className="size-3.5" aria-hidden />
                          {row.phone}
                        </span>
                      </span>
                      <span className="mt-1 line-clamp-2 block text-sm text-(--a-muted)">{row.note}</span>
                      <span className="mt-1 block text-xs text-(--a-muted)">{formatTime(row.at)}</span>
                    </span>
                    <Badge tone={current.tone}>{current.label}</Badge>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <Pager pager={pager} />
      </Panel>

      <Drawer
        open={open !== undefined}
        onClose={() => setOpenId(null)}
        title="تفاصيل طلب التجهيز"
        lead={open ? formatTime(open.at) : undefined}
        footer={
          <>
            <Button onClick={() => setOpenId(null)}>إلغاء</Button>
            <Button variant="primary" onClick={save}>
              حفظ
            </Button>
          </>
        }
      >
        {open ? (
          <div className="space-y-5">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-(--a-muted)">الاسم</dt>
                <dd className="mt-1 font-medium">{open.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-(--a-muted)">رقم الجوال</dt>
                <dd dir="ltr" className="mt-1 text-end font-medium">
                  {open.phone}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-(--a-muted)">تفاصيل التجهيز</dt>
                <dd className="mt-1 whitespace-pre-line leading-7">{open.note}</dd>
              </div>
            </dl>
            <Select label="الحالة" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
            <Field label="ملاحظات داخلية (للإدارة فقط، لا تظهر للعميل)" value={notes} onChange={setNotes} multiline />
            {error ? (
              <p role="alert" className="text-sm text-(--a-danger)">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
