import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useLang } from "@/lib/i18n";
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

  return (
    <section className="ambient-edge bg-white py-12 sm:py-16" aria-labelledby="solutions-title">
      <div className="mx-auto max-w-7xl px-4">
        <div className="reveal max-w-2xl">
          <p className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.22em] text-emerald">
            {block.eyebrow}
            <span className="h-px w-12 bg-lime/70" />
          </p>
          <h2 id="solutions-title" className="mt-3 text-2xl font-bold tracking-tight text-navy sm:text-4xl">
            {block.title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-navy/55 sm:text-[15px]">{block.lead}</p>
        </div>

        <div className="reveal-stagger mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SOLUTIONS.map((item) => {
            const text = copy.get(item.id);
            return (
              <Link key={item.id} href={`/${lang}/c/${item.slug}`} className="solution-card">
                <div className="solution-stage">
                  <span className="solution-stage__glow" aria-hidden />
                  <span className="solution-stage__platform" aria-hidden />
                  <img src={item.image} alt="" className="solution-stage__img" />
                </div>
                <h3 className="mt-4 text-base font-bold leading-7 text-navy">{text?.title}</h3>
                <p className="mt-1.5 text-sm leading-7 text-navy/55">{text?.text}</p>
                <span className="mt-auto flex justify-end pt-5">
                  <span className="solution-card__arrow" aria-hidden>
                    <ArrowLeft className={`size-4 ${dir === "ltr" ? "rotate-180" : ""}`} />
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <button type="button" className="solution-cta">
            {block.action}
            <ArrowLeft className={`size-4 ${dir === "ltr" ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
    </section>
  );
}
