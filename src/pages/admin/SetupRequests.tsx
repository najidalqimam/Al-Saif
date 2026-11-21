import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Phone } from "lucide-react";
import { INQUIRIES_KEY, inquiryId, loadInquiries, statusOf, updateInquiry, type InquiryStatus, type SetupInquiry } from "@/lib/setup-inquiries";
import { onHashMove, pushHash, readHash } from "./nav";
import { AR_DATE, Badge, Button, DemoNote, Empty, Field, PageHead, Pager, Panel, Select, Tabs, usePager } from "./ui";

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

const REQUEST_PREFIX = "request-";
/** The id of the request the address (#setupRequests/request-<id>) points at, or null for the list. */
const openIdOf = (sub: string | null) => (sub?.startsWith(REQUEST_PREFIX) ? sub.slice(REQUEST_PREFIX.length) : null);

/** "Ask us to prepare your order" requests sent from the storefront form: list, open a request as its own page, set the status, keep internal notes. */
export function SetupRequests() {
  const [rows, setRows] = useState<SetupInquiry[]>(() => loadInquiries());
  const [filter, setFilter] = useState<"all" | InquiryStatus>("all");
  const [openId, setOpenId] = useState<string | null>(() => openIdOf(readHash().sub));
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

  // The open request lives in the address, so a refresh and the back gesture keep the place.
  useEffect(() => onHashMove(() => setOpenId(openIdOf(readHash().sub))), []);

  const counts = useMemo(() => {
    const result = { new: 0, contacting: 0, done: 0 };
    for (const row of rows) result[statusOf(row)] += 1;
    return result;
  }, [rows]);
  const shown = filter === "all" ? rows : rows.filter((row) => statusOf(row) === filter);
  const pager = usePager(shown, filter);
  const open = openId ? rows.find((row) => inquiryId(row) === openId) : undefined;

  // Each time a request opens, the form starts from what is saved for it.
  useEffect(() => {
    const row = openId ? loadInquiries().find((item) => inquiryId(item) === openId) : undefined;
    setStatus(row ? statusOf(row) : "new");
    setNotes(row?.adminNotes ?? "");
    setError("");
  }, [openId]);

  const show = (row: SetupInquiry) => pushHash("setupRequests", `${REQUEST_PREFIX}${inquiryId(row)}`);
  const backToList = () => pushHash("setupRequests");

  function save() {
    if (!open) return;
    if (!updateInquiry(inquiryId(open), { status, adminNotes: notes.trim() })) {
      setError("تعذّر حفظ التغيير في هذا المتصفح. حاول مرة ثانية.");
      return;
    }
    setRows(loadInquiries());
    backToList();
  }

  if (openId) {
    return (
      <div className="space-y-6">
        <PageHead title={open ? `تفاصيل طلب التجهيز: ${open.name}` : "تفاصيل طلب التجهيز"} lead={open ? formatTime(open.at) : undefined} />
        {open ? (
          <Panel className="max-w-2xl">
            <div className="space-y-5 p-5">
              <div className="flex items-start justify-between gap-4 text-sm">
                <dl>
                  <dt className="text-xs font-medium text-(--a-muted)">الاسم</dt>
                  <dd className="mt-1 font-medium">{open.name}</dd>
                </dl>
                <div className="w-32 shrink-0">
                  <Select label="الحالة" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
                </div>
              </div>
              <dl className="space-y-3 text-sm">
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
              <Field label="ملاحظات داخلية (للإدارة فقط، لا تظهر للعميل)" value={notes} onChange={setNotes} multiline />
              {error ? (
                <p role="alert" className="text-sm text-(--a-danger)">
                  {error}
                </p>
              ) : null}
              <div className="flex items-center gap-2 border-t border-(--a-line) pt-5">
                <Button variant="primary" onClick={save}>
                  حفظ
                </Button>
                <Button onClick={backToList}>إلغاء</Button>
              </div>
            </div>
          </Panel>
        ) : (
          <Panel>
            <Empty icon={ClipboardList} title="ما لقينا هذا الطلب" lead="يمكن إنه انحذف أو انفتح من متصفح ثاني. ارجع لقائمة طلبات التجهيز." />
          </Panel>
        )}
      </div>
    );
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

    </div>
  );
}
