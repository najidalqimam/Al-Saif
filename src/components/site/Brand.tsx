import { publicUrl } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";

/** The store's own logo mark, used when no logo has been uploaded from the dashboard. */
const BUILT_IN_LOGO = publicUrl("/brand/logo.png");

/** Store logo tile: the uploaded logo from the dashboard, or the built-in logo mark. */
export function BrandMark({ size = "size-11 rounded-2xl" }: { size?: string }) {
  const { content } = useSiteContent();
  const { logo } = content.brand;
  // A white tile in both themes, so the mark's black parts stay visible on dark headers, footers and sidebars.
  return (
    <span className={`grid ${size} shrink-0 place-items-center overflow-hidden bg-white p-0.5 shadow-sm ring-1 ring-navy/10`}>
      <img src={logo || BUILT_IN_LOGO} alt="" className="size-full object-contain" />
    </span>
  );
}

/** Store name and tagline as set in the dashboard, falling back to the built-in copy. */
export function useBrandText() {
  const { lang, t } = useLang();
  const { content } = useSiteContent();
  return {
    name: content.brand.name[lang] || t.brand,
    tagline: content.brand.tagline[lang] || t.tagline,
  };
}
