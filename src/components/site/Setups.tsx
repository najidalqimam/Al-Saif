import { ArrowLeft } from "lucide-react";
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

  return (
    <section className="on-dark tone-a tone-swap-light section-y relative isolate overflow-hidden" aria-labelledby="solutions-title">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-80 bg-[radial-gradient(50%_100%_at_50%_0%,rgba(37,217,230,0.14),transparent)]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -end-24 -z-10 size-96 rounded-full bg-blue/10 blur-3xl" />
      <div className="page-shell">
        <div className="reveal flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">{block.eyebrow}</p>
            <h2 id="solutions-title" className="section-title">
              {block.title}
            </h2>
            <p className="section-lead">{block.lead}</p>
          </div>
          <button type="button" className="solution-cta shrink-0 self-start md:self-auto">
            {block.action}
            <ArrowLeft className={`size-4 ${dir === "ltr" ? "rotate-180" : ""}`} aria-hidden />
          </button>
        </div>

        <div className="reveal-stagger mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
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
    </section>
  );
}
