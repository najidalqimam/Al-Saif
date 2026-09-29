import { useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, ShieldCheck, Tag, Truck, Wallet } from "lucide-react";
import { ServiceCard } from "@/components/site/showcase";
import { useLang, type Translations } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";

type Slide = Translations["hero"]["slides"][number];

const VISUALS = [
  { src: "/hero-visuals/console.png?v=3", tilt: -8, frame: "bottom-[18%] h-[68%] w-[86%]", cast: "w-[64%]" },
  { src: "/hero-visuals/headset.png?v=5", tilt: 11, frame: "bottom-[18%] h-[58%] w-[54%]", cast: "w-[42%]" },
  { src: "/hero-visuals/phone.png?v=3", tilt: -6, frame: "bottom-[18%] h-[60%] w-[34%]", cast: "w-[26%]" },
];

const PERK_ICONS = [Truck, ShieldCheck, Tag, Wallet];
const AUTOPLAY_MS = 4500;

const HERO_BACKGROUND =
  "radial-gradient(ellipse at 68% 46%, rgba(0, 168, 120, 0.22), transparent 42%), radial-gradient(ellipse at 16% 82%, rgba(11, 64, 53, 0.55), transparent 40%), linear-gradient(180deg, #062E26 0%, #0B4035 54%, #062E26 100%)";

export function Hero() {
  const { t, dir, lang } = useLang();
  const { content } = useSiteContent();
  const slides = t.hero.slides.map((slide, index) => ({
    ...slide,
    ...(content.hero[lang][index] ?? {}),
  }));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const total = slides.length;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || total < 2) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % total);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [paused, reducedMotion, total, index]);

  function show(next: number) {
    setIndex((next + total) % total);
  }

  return (
    <section id="hero" className="relative overflow-hidden text-white" style={{ background: HERO_BACKGROUND }}>
      <div
        className="overflow-hidden pt-6 sm:pt-8"
        aria-roledescription="carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="grid w-full min-w-0">
          {slides.map((item, itemIndex) => (
            <SlidePanel
              key={item.title}
              slide={item}
              dir={dir}
              image={(VISUALS[itemIndex] ?? VISUALS[0]).src}
              tilt={(VISUALS[itemIndex] ?? VISUALS[0]).tilt}
              frame={(VISUALS[itemIndex] ?? VISUALS[0]).frame}
              cast={(VISUALS[itemIndex] ?? VISUALS[0]).cast}
              imageAlt={t.hero.imageAlt}
              active={itemIndex === index}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label={t.hero.prev}
            onClick={() => show(index - 1)}
            className="grid size-9 place-items-center rounded-full border border-white/20 text-white/75 transition-colors duration-300 hover:border-[#00A878] hover:text-[#B8E63E]"
          >
            <ChevronLeft className={`size-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
          </button>
          <div className="flex items-center gap-1.5">
            {slides.map((item, itemIndex) => (
              <button
                key={item.title}
                type="button"
                aria-label={item.title}
                aria-current={itemIndex === index ? "true" : undefined}
                onClick={() => show(itemIndex)}
                className={`rounded-full transition-[width,background-color] duration-300 ${
                  itemIndex === index ? "h-1.5 w-6 bg-emerald" : "size-1.5 bg-white/35 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label={t.hero.next}
            onClick={() => show(index + 1)}
            className="grid size-9 place-items-center rounded-full border border-white/20 text-white/75 transition-colors duration-300 hover:border-[#00A878] hover:text-[#B8E63E]"
          >
            <ChevronRight className={`size-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
          </button>
          <p className="sr-only">{t.hero.position.replace("{current}", String(index + 1)).replace("{total}", String(total))}</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-3 px-4 py-5 sm:grid-cols-2 lg:grid-cols-4 lg:py-6">
        {t.catalog.perks.map((perk, perkIndex) => {
          const Icon = PERK_ICONS[perkIndex] ?? Truck;
          return <ServiceCard key={perk.title} icon={Icon} title={perk.title} text={perk.text} tone="dark" platform={false} />;
        })}
      </div>
    </section>
  );
}

function SlidePanel({
  slide,
  dir,
  image,
  imageAlt,
  active,
  tilt,
  frame,
  cast,
}: {
  slide: Slide;
  dir: "rtl" | "ltr";
  image: string;
  imageAlt: string;
  active: boolean;
  tilt: number;
  frame: string;
  cast: string;
}) {
  return (
    <article
      aria-hidden={active ? undefined : true}
      inert={active ? undefined : true}
      className={`hero-panel ${active ? "is-active" : ""}`}
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-4 px-4 lg:grid-cols-2 lg:gap-8">
      <div className="flex flex-col items-start">
        <div className="hero-copy">
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-emerald">
            {slide.eyebrow}
            <span className="h-px w-14 bg-emerald/80" />
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-[1.15] tracking-tight sm:text-5xl">
            {slide.title}
            <span className="relative mt-2 block text-[#8ee0c0]">
              {slide.titleRest}
              <span className="absolute -bottom-1 start-0 h-[3px] w-24 rounded-full bg-emerald" />
            </span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-white/70">{slide.lead}</p>
        </div>
        <div className="hero-cta mt-5 flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-emerald px-6 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(15,159,110,0.35)] transition hover:bg-[#14b47e]"
          >
            {slide.primary}
            <ArrowLeft className={`size-4 ${dir === "ltr" ? "rotate-180" : ""}`} />
          </button>
          <button type="button" className="inline-flex items-center gap-3 text-sm font-medium text-white">
            <span className="grid size-12 place-items-center rounded-full border border-white/25 bg-white/5">
              <ArrowLeft className={`size-4 ${dir === "ltr" ? "rotate-180" : ""}`} />
            </span>
            {slide.secondary}
          </button>
        </div>
      </div>

      <HeroStage src={image} alt={active ? imageAlt : ""} tilt={tilt} frame={frame} cast={cast} />
      </div>
    </article>
  );
}

function HeroStage({
  src,
  alt,
  tilt,
  frame,
  cast,
}: {
  src: string;
  alt: string;
  tilt: number;
  frame: string;
  cast: string;
}) {
  return (
    <div className="relative mx-auto h-[300px] w-full max-w-lg sm:h-[380px]">
      <div aria-hidden className="hero-ambient" />
      <div className={`hero-product absolute left-1/2 z-10 ${frame}`}>
        <div className="hero-float h-full w-full">
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-contain object-bottom"
            style={{
              transform: `rotate(${tilt}deg)`,
              transformOrigin: "center bottom",
              filter: "drop-shadow(0 10px 8px rgba(0,0,0,0.18))",
            }}
          />
        </div>
      </div>
      <div aria-hidden className="hero-plinth absolute bottom-[1%] left-1/2 z-[5] w-[92%] -translate-x-1/2">
        <span className="hero-plinth__shadow" />
        <span className="hero-plinth__top" />
        <span className={`hero-plinth__cast ${cast}`} />
      </div>
    </div>
  );
}
