import { useState } from "react";
import { CircleAlert, Save } from "lucide-react";
import { apiMessage } from "@/lib/api";
import { useSiteContent, type ShopInput } from "@/lib/site-content";
import { Button, Field, PageHead, Panel, num } from "../admin/ui";

/** The shop's own details (name, owner, contact, address, about). They live here, not on the products page. */
export function ShopAccount({ shopId }: { shopId: string }) {
  const { shops, content, updateShop } = useSiteContent();
  const shop = shops.find((item) => item.id === shopId);
  const saved = {
    name: shop?.name ?? "",
    ownerName: shop?.ownerName ?? "",
    phone: shop?.phone ?? "",
    email: shop?.email ?? "",
    city: shop?.city ?? "",
    address: shop?.address ?? "",
    description: shop?.description ?? "",
  };
  const [form, setForm] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const set = (patch: Partial<typeof form>) => {
    setForm((current) => ({ ...current, ...patch }));
    setDone(false);
  };
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  async function save() {
    if (!form.name.trim()) {
      setError("اسم المحل مطلوب.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const details = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()])) as unknown as ShopInput;
      await updateShop(shopId, details);
      setForm({ ...form, ...details } as typeof form);
      setDone(true);
    } catch (failure) {
      setError(apiMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="حساب المحل"
        lead={done ? "انحفظت بيانات المحل." : dirty ? "فيه تعديلات غير محفوظة." : `بيانات محلك. عدد منتجاتك ${num.format(content.products.filter((item) => !item.archived && !item.approval).length)}.`}
        actions={
          <Button variant="primary" icon={Save} onClick={() => void save()} disabled={!dirty || busy}>
            {busy ? "جاري الحفظ…" : "حفظ"}
          </Button>
        }
      />
      {error ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-(--a-danger)/30 px-4 py-3 text-sm text-(--a-danger)">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}
      <Panel title="بيانات المحل">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="اسم المحل" value={form.name} onChange={(name) => set({ name })} />
          <Field label="اسم المسؤول" value={form.ownerName} onChange={(ownerName) => set({ ownerName })} />
          <Field label="الجوال" value={form.phone} onChange={(phone) => set({ phone })} dir="ltr" />
          <Field label="البريد الإلكتروني" value={form.email} onChange={(email) => set({ email })} type="email" dir="ltr" />
          <Field label="المدينة" value={form.city} onChange={(city) => set({ city })} />
          <Field label="العنوان" value={form.address} onChange={(address) => set({ address })} />
          <div className="sm:col-span-2">
            <Field label="نبذة عن المحل" value={form.description} onChange={(description) => set({ description })} multiline />
          </div>
        </div>
      </Panel>
    </div>
  );
}
