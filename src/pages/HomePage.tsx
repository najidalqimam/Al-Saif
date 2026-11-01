import { useEffect } from "react";
import { Addons } from "@/components/site/Addons";
import { Bestsellers } from "@/components/site/Bestsellers";
import { Categories } from "@/components/site/Categories";
import { CustomSection } from "@/components/site/CustomSection";
import { Hero } from "@/components/site/Hero";
import { Offers } from "@/components/site/Offers";
import { Setups } from "@/components/site/Setups";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { useSiteContent, type SectionKey } from "@/lib/site-content";

const BUILT_IN: Record<SectionKey, () => React.JSX.Element | null> = {
  hero: Hero,
  catalog: Categories,
  deals: Offers,
  bestsellers: Bestsellers,
  addons: Addons,
  setups: Setups,
};

export function HomePage() {
  const { content } = useSiteContent();

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    main.classList.add("motion");
    const nodes = main.querySelectorAll(".reveal, .reveal-stagger > *");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-shown");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -6% 0px" },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="home-shell min-h-svh bg-white text-navy">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        {/* Sections follow the order and visibility set in the dashboard. */}
        {content.homeOrder.map((id) => {
          if (id in BUILT_IN) {
            const key = id as SectionKey;
            const Section = BUILT_IN[key];
            return content.sectionHidden.includes(key) ? null : <Section key={key} />;
          }
          const custom = content.customSections.find((item) => item.id === id);
          return custom && !custom.hidden ? <CustomSection key={id} section={custom} /> : null;
        })}
      </main>
      <SiteFooter />
    </div>
  );
}
