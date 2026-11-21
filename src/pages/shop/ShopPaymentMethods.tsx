import { useState } from "react";
import { Banknote, CircleAlert, Landmark, Save } from "lucide-react";
import { apiMessage } from "@/lib/api";
import { useSiteContent, type ShopPayment } from "@/lib/site-content";
import { Badge, Button, Field, Panel, Switch } from "../admin/ui";

/** The payment details a shop gives the store, with empty values filled in: Cash on delivery is on by default. */
const withDefaults = (payment: ShopPayment | undefined): Required<ShopPayment> => ({
  bankName: payment?.bankName ?? "",
  accountHolder: payment?.accountHolder ?? "",
  iban: payment?.iban ?? "",
  accountNumber: payment?.accountNumber ?? "",
  acceptsCod: payment?.acceptsCod ?? true,
  acceptsBankTransfer: payment?.acceptsBankTransfer ?? false,
  notes: payment?.notes ?? "",
});

/** The shop's payment methods and bank details. They are saved with the shop and shown on its page in the admin dashboard. */
export function ShopPaymentMethods({ shopId }: { shopId: string }) {
  const { shops, updateShop } = useSiteContent();
  const saved = withDefaults(shops.find((item) => item.id === shopId)?.payment);
  const [form, setForm] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const set = (patch: Partial<typeof form>) => {
    setForm((current) => ({ ...current, ...patch }));
    setDone(false);
  };
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const ibanProblem = form.iban.trim() !== "" && !/^[A-Za-z]{2}[0-9A-Za-z ]{10,38}$/.test(form.iban.trim());
  const numberProblem = form.accountNumber.trim() !== "" && !/^[0-9 -]+$/.test(form.accountNumber.trim());
  const bankMissing = form.acceptsBankTransfer && !form.iban.trim() && !form.accountNumber.trim();

  async function save() {
    if (ibanProblem || numberProblem) {
      setError("راجع رقم الآيبان ورقم الحساب: الآيبان حروف وأرقام، ورقم الحساب أرقام فقط.");
      return;
    }
    if (bankMissing) {
      setError("لو قبلت التحويل البنكي، اكتب رقم الآيبان أو رقم الحساب.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payment = { ...form, bankName: form.bankName.trim(), accountHolder: form.accountHolder.trim(), iban: form.iban.replace(/\s+/g, "").toUpperCase(), accountNumber: form.accountNumber.trim(), notes: form.notes.trim() };
      await updateShop(shopId, { payment });
      setForm(payment);
      setDone(true);
    } catch (failure) {
      setError(apiMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel
      title="طرق الدفع وبيانات البنك"
      lead="الطرق اللي بتستلم بها فلوس طلباتك. هذي البيانات تظهر للإدارة في صفحة محلك."
      actions={
        <Button variant="primary" icon={Save} onClick={() => void save()} disabled={!dirty || busy}>
          {busy ? "جاري الحفظ…" : done && !dirty ? "تم الحفظ" : "حفظ"}
        </Button>
      }
    >
      <div className="space-y-5 p-5">
        {error ? (
          <p role="alert" className="flex items-start gap-2 rounded-xl border border-(--a-danger)/30 px-4 py-3 text-sm text-(--a-danger)">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-(--a-line) px-4 py-3">
            <span className="flex items-center gap-2.5 text-sm font-medium">
              <Banknote className="size-4 text-(--a-muted)" />
              الدفع عند الاستلام
            </span>
            <Switch checked={form.acceptsCod} onChange={(acceptsCod) => set({ acceptsCod })} label="قبول الدفع عند الاستلام" />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-(--a-line) px-4 py-3">
            <span className="flex items-center gap-2.5 text-sm font-medium">
              <Landmark className="size-4 text-(--a-muted)" />
              التحويل البنكي
            </span>
            <Switch checked={form.acceptsBankTransfer} onChange={(acceptsBankTransfer) => set({ acceptsBankTransfer })} label="قبول التحويل البنكي" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم البنك" value={form.bankName} onChange={(bankName) => set({ bankName })} />
          <Field label="اسم صاحب الحساب" value={form.accountHolder} onChange={(accountHolder) => set({ accountHolder })} />
          <Field label="رقم الآيبان (IBAN)" value={form.iban} onChange={(iban) => set({ iban })} dir="ltr" placeholder="SA00 0000 0000 0000 0000 0000" />
          <Field label="رقم الحساب" value={form.accountNumber} onChange={(accountNumber) => set({ accountNumber })} dir="ltr" />
        </div>
        <Field label="ملاحظات الدفع (اختياري)" value={form.notes} onChange={(notes) => set({ notes })} multiline placeholder="مثلًا: التحويل قبل الشحن بيوم" />
      </div>
    </Panel>
  );
}

/** The same details, read only, for the admin's page of the shop. */
export function ShopPaymentSummary({ payment }: { payment: ShopPayment | undefined }) {
  const value = withDefaults(payment);
  const rows: Array<[string, string]> = [
    ["اسم البنك", value.bankName],
    ["اسم صاحب الحساب", value.accountHolder],
    ["رقم الآيبان", value.iban],
    ["رقم الحساب", value.accountNumber],
  ];
  const nothing = !value.bankName && !value.accountHolder && !value.iban && !value.accountNumber && !value.notes;
  return (
    <Panel title="طرق الدفع وبيانات البنك" lead="اللي أدخله المحل من لوحته. تقدر تراجعه قبل تحويل أي مبالغ له.">
      <div className="space-y-4 p-5 text-sm">
        <div className="flex flex-wrap gap-2">
          <Badge tone={value.acceptsCod ? "ok" : "muted"}>الدفع عند الاستلام: {value.acceptsCod ? "مقبول" : "غير مقبول"}</Badge>
          <Badge tone={value.acceptsBankTransfer ? "ok" : "muted"}>التحويل البنكي: {value.acceptsBankTransfer ? "مقبول" : "غير مقبول"}</Badge>
        </div>
        {nothing ? (
          <p className="text-(--a-muted)">المحل ما أدخل بيانات بنكه بعد.</p>
        ) : (
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {rows.map(([label, text]) => (
              <div key={label}>
                <dt className="text-xs font-medium text-(--a-muted)">{label}</dt>
                <dd dir={label.includes("رقم") ? "ltr" : undefined} className={`mt-1 font-medium ${label.includes("رقم") ? "text-end tabular-nums" : ""}`}>
                  {text || <span className="font-normal text-(--a-muted)">—</span>}
                </dd>
              </div>
            ))}
            {value.notes ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-(--a-muted)">ملاحظات الدفع</dt>
                <dd className="mt-1 whitespace-pre-line leading-7">{value.notes}</dd>
              </div>
            ) : null}
          </dl>
        )}
      </div>
    </Panel>
  );
}
