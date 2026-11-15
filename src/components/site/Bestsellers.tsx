import { useEffect, useId, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Boxes, X } from "lucide-react";
import { toast } from "sonner";
import { ProductDialog, type OfferProduct } from "@/components/site/Offers";
import { IconTile, ProductCard } from "@/components/site/showcase";
import { useFavorites } from "@/lib/favorites";
import { useLang } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";

const GROUPS: Record<string, readonly string[]> = {
  all: ["phone", "console", "controller", "earbuds", "headset"],
  phones: ["phone", "phone-mini", "case", "charger", "cable"],
  playstation: ["console", "controller", "game", "headset", "controller-extra"],
  accessories: ["earbuds", "charger", "storage", "dock", "cable"],
};

const PHONE_OK = /^05\d{8}$/;

export function Bestsellers() {
  const { t, lang } = useLang();
  const { content, copyOf, productById } = useSiteContent();
  const block = content.bestsellers[lang];
  const [group, setGroup] = useState("all");
  const { has, toggle } = useFavorites();
  const [openId, setOpenId] = useState<string | null>(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const selectedFilter = t.bestsellers.filters.find((filter) => filter.id === group) ?? t.bestsellers.filters[0];
  const title = t.bestsellers.titleFrom.replace("{name}", selectedFilter.label);
  const ids = GROUPS[group] ?? GROUPS.all;
  const products = ids
    .map((id) => productById(id))
    .filter((item): item is OfferProduct => item !== undefined);
  const openProduct = openId ? productById(openId) ?? null : null;

  return (
    <section className="ambient section-y tone-b tone-swap-light" aria-labelledby="bestsellers-title">
      <div className="page-shell">
        <div className="reveal flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">{block.eyebrow}</p>
            <h2 id="bestsellers-title" className="section-title">
              {title}
            </h2>
            <p className="section-lead">{block.lead}</p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <button
              type="button"
              onClick={() => setGroup("all")}
              className="inline-flex h-11 cursor-pointer items-center rounded-full bg-navy px-5 text-sm font-semibold text-white transition-colors hover:bg-deep"
            >
              {t.bestsellers.viewAll}
            </button>
            <div className="flex flex-wrap gap-2">
              {t.bestsellers.filters.map((filter) => {
                const selected = filter.id === group;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setGroup(filter.id)}
                    className={`h-11 cursor-pointer rounded-full px-4 text-sm font-medium transition-colors ${
                      selected
                        ? "bg-brand text-navy"
                        : "border border-navy/15 bg-white text-navy hover:border-brand hover:text-brand-ink"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="reveal-stagger mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {products.map((product) => {
            const copy = copyOf(lang, product.id) ?? t.deals.products[product.id];
            return (
              <ProductCard
                key={product.id}
                product={product}
                name={copy?.name ?? ""}
                category={copy?.category ?? ""}
                liked={has(product.id)}
                badge={t.bestsellers.badges[product.id]}
                onOpen={() => setOpenId(product.id)}
                onToggleSave={() => toggle(product.id)}
              />
            );
          })}
        </div>

        <div className="mt-10 flex flex-col gap-5 promo-strip rounded-3xl border px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-4">
            <IconTile icon={Boxes} />
            <div>
              <p className="text-base font-bold text-navy">{block.bannerTitle}</p>
              <p className="mt-1 text-sm leading-6 text-ink-soft">{block.bannerLead}</p>
            </div>
          </div>
          <button type="button" className="btn-brand shrink-0" onClick={() => setInquiryOpen(true)}>
            {t.bestsellers.bannerAction}
          </button>
        </div>
      </div>

      {openProduct ? (
        <ProductDialog
          product={openProduct}
          liked={has(openProduct.id)}
          onClose={() => setOpenId(null)}
          onToggleSave={() => toggle(openProduct.id)}
        />
      ) : null}

      {inquiryOpen ? <SetupInquiryDialog onClose={() => setInquiryOpen(false)} /> : null}
    </section>
  );
}

function SetupInquiryDialog({ onClose }: { onClose: () => void }) {
  const { t, dir } = useLang();
  const copy = t.bestsellers.inquiry;
  const titleId = useId();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string; note?: string }>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function validate() {
    const next: typeof errors = {};
    if (!name.trim()) next.name = copy.required;
    const mobile = phone.replace(/[\s-]/g, "");
    if (!PHONE_OK.test(mobile)) next.phone = copy.phoneError;
    if (!note.trim()) next.note = copy.required;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    setSending(true);
    // Persist locally until store contact settings / WhatsApp are wired in admin.
    try {
      const key = "al-saif-setup-inquiries";
      const prior = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown[];
      const row = {
        name: name.trim(),
        phone: phone.replace(/[\s-]/g, ""),
        note: note.trim(),
        at: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify([row, ...(Array.isArray(prior) ? prior : [])].slice(0, 50)));
    } catch {
      /* ignore quota / private mode */
    }
    toast.success(copy.success);
    setSending(false);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-navy/40 p-4 backdrop-blur-md" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        dir={dir}
        onClick={(event) => event.stopPropagation()}
        className="relative my-auto w-full max-w-lg overflow-hidden rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.close}
          className="absolute end-4 top-4 grid size-10 cursor-pointer place-items-center rounded-full bg-navy/5 text-ink-soft hover:bg-navy/10"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-start gap-3 pe-10">
          <IconTile icon={Boxes} />
          <div>
            <h2 id={titleId} className="text-xl font-bold text-navy">
              {copy.title}
            </h2>
            <p className="mt-2 text-sm leading-7 text-ink-soft">{copy.lead}</p>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
          <Field label={copy.name} error={errors.name}>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              className={inputClass(Boolean(errors.name))}
            />
          </Field>
          <Field label={copy.phone} error={errors.phone}>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="tel"
              dir="ltr"
              placeholder={copy.phoneHint}
              autoComplete="tel"
              className={inputClass(Boolean(errors.phone))}
            />
          </Field>
          <Field label={copy.note} error={errors.note}>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              placeholder={copy.noteHint}
              className={`${inputClass(Boolean(errors.note))} min-h-28 resize-y py-3`}
            />
          </Field>
          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="h-11 cursor-pointer rounded-full px-5 text-sm font-semibold text-navy hover:bg-navy/5">
              {copy.close}
            </button>
            <button type="submit" disabled={sending} className="btn-brand disabled:opacity-60">
              {copy.submit}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function inputClass(error: boolean) {
  return `h-11 w-full rounded-xl border bg-white px-3 text-sm text-navy outline-none transition focus:border-brand ${error ? "border-burgundy" : "border-navy/15"}`;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-navy">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
