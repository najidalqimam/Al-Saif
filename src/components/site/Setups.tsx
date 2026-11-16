import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X } from "lucide-react";
import { Link } from "wouter";
import { useLang } from "@/lib/i18n";
import { publicUrl } from "@/lib/utils";
import { useSiteContent } from "@/lib/site-content";

const SOLUTIONS = [
  { id: "networking", slug: "networking", image: "/departments/networking.png" },
  { id: "pos", slug: "pos", image: "/departments/pos.png" },
  { id: "security", slug: "security", image: "/departments/cctv-cut.png?v=2" },
  { id: "servers", slug: "servers", image: "/departments/servers.png" },
] as const;

export function Setups() {
  const { t, dir, lang } = useLang();
  const { content } = useSiteContent();
  const block = content.setups[lang];
  const copy = new Map(t.setups.items.map((item) => [item.id, item]));
  const [pickerOpen, setPickerOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!pickerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPickerOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [pickerOpen]);

  return (
    <section className="on-dark tone-a tone-swap-light section-y relative isolate overflow-hidden" aria-labelledby="solutions-title">
      <div aria-hidden className="setups-glow pointer-events-none absolute inset-x-0 -top-24 -z-10 h-80 bg-[radial-gradient(50%_100%_at_50%_0%,rgb(var(--accent-rgb)/0.14),transparent)]" />
      <div aria-hidden className="setups-glow pointer-events-none absolute -bottom-32 -end-24 -z-10 size-96 rounded-full bg-blue/10 blur-3xl" />
      <div className="page-shell">
        <div className="reveal flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">{block.eyebrow}</p>
            <h2 id="solutions-title" className="section-title">
              {block.title}
            </h2>
            <p className="section-lead">{block.lead}</p>
          </div>
          <button type="button" className="solution-cta shrink-0 self-start md:self-auto" onClick={() => setPickerOpen(true)}>
            {block.action}
            <ArrowLeft className={`size-4 ${dir === "ltr" ? "rotate-180" : ""}`} aria-hidden />
          </button>
        </div>

        <div id="solutions-grid" className="reveal-stagger mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
          {SOLUTIONS.map((item) => {
            const text = copy.get(item.id);
            return (
              <Link key={item.id} href={`/${lang}/c/${item.slug}`} className="solution-card led-edge relative">
                <div className="solution-stage">
                  <span className="solution-stage__glow" aria-hidden />
                  <span className="solution-stage__platform" aria-hidden />
                  <img src={publicUrl(item.image)} alt="" loading="lazy" decoding="async" className="solution-stage__img" />
                </div>
                <h3 className="mt-4 px-1 text-base font-bold leading-7 text-white">{text?.title}</h3>
                <p className="mt-1 px-1 text-sm leading-7 text-white/75">{text?.text}</p>
                <span className="mt-auto flex justify-end px-1 pt-5">
                  <span className="solution-card__arrow" aria-hidden>
                    <ArrowLeft className={`size-4 ${dir === "ltr" ? "rotate-180" : ""}`} />
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {pickerOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-end justify-center bg-navy/50 p-4 backdrop-blur-md sm:items-center"
              onClick={() => setPickerOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                dir={dir}
                onClick={(event) => event.stopPropagation()}
                className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-[#0b1f3a] [html.light_&]:bg-white [html.light_&]:border [html.light_&]:border-navy/10 p-5 shadow-2xl sm:p-7"
              >
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  aria-label={dir === "rtl" ? "إغلاق" : "Close"}
                  className="absolute end-4 top-4 grid size-10 cursor-pointer place-items-center rounded-full bg-white/10 text-white hover:bg-white/15 [html.light_&]:bg-navy/5 [html.light_&]:text-navy [html.light_&]:hover:bg-navy/10"
                >
                  <X className="size-5" />
                </button>
                <h2 id={titleId} className="pe-10 text-xl font-bold text-white [html.light_&]:text-navy">
                  {block.action}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-7 text-white/70 [html.light_&]:text-navy/70">{block.lead}</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {SOLUTIONS.map((item) => {
                    const text = copy.get(item.id);
                    return (
                      <Link
                        key={item.id}
                        href={`/${lang}/c/${item.slug}`}
                        onClick={() => setPickerOpen(false)}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:border-brand/50 hover:bg-white/10 [html.light_&]:border-navy/10 [html.light_&]:bg-[#F4F7FB] [html.light_&]:hover:border-brand-ink/40 [html.light_&]:hover:bg-brand/10"
                      >
                        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/5 [html.light_&]:bg-white">
                          <img src={publicUrl(item.image)} alt="" className="max-h-12 max-w-12 object-contain" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-white [html.light_&]:text-navy">{text?.title}</span>
                          <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-white/65 [html.light_&]:text-navy/65">{text?.text}</span>
                        </span>
                        <ArrowLeft className={`size-4 shrink-0 text-brand [html.light_&]:text-brand-ink ${dir === "ltr" ? "rotate-180" : ""}`} aria-hidden />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
