import { useEffect } from "react";
import { Addons } from "@/components/site/Addons";
import { Bestsellers } from "@/components/site/Bestsellers";
import { Categories } from "@/components/site/Categories";
import { Hero } from "@/components/site/Hero";
import { Offers } from "@/components/site/Offers";
import { Setups } from "@/components/site/Setups";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { useSiteContent } from "@/lib/site-content";

export function HomePage() {
  const { content } = useSiteContent();
  const on = (key: (typeof content.sectionHidden)[number]) => !content.sectionHidden.includes(key);

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
        {on("hero") ? <Hero /> : null}
        {on("catalog") ? <Categories /> : null}
        {on("deals") ? <Offers /> : null}
        {on("bestsellers") ? <Bestsellers /> : null}
        {on("addons") ? <Addons /> : null}
        {on("setups") ? <Setups /> : null}
      </main>
      <SiteFooter />
    </div>
  );
}
