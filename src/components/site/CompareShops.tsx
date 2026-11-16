import { Scale } from "lucide-react";
import { Link } from "wouter";
import { useLang } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";

/** "Compare with other shops": opens the comparison page when other shops list the same product (same explicit match key). */
export function CompareShops({ productId }: { productId: string }) {
  const { lang, t } = useLang();
  const { offersOf } = useSiteContent();
  if (offersOf(productId).filter((offer) => offer.shop).length < 2) return null;
  return (
    <Link
      href={`/${lang}/compare/${productId}`}
      className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-brand-ink/30 bg-white px-4 py-2 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand/10"
    >
      <Scale className="size-4" aria-hidden />
      {t.compare.compareButton}
    </Link>
  );
}
