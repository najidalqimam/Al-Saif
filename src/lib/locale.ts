import type { Lang } from "@/lib/i18n";

/** UI languages available in the storefront. */
export const LANGS = ["ar", "en", "ur"] as const satisfies readonly Lang[];

/** CMS / catalogue bilingual fields stay Arabic + English; Urdu falls back to Arabic. */
export type ContentLang = "ar" | "en";

export const LANG_META: Record<
  Lang,
  { label: string; short: string; native: string; dir: "rtl" | "ltr"; htmlLang: string }
> = {
  ar: { label: "العربية", short: "ع", native: "العربية", dir: "rtl", htmlLang: "ar" },
  en: { label: "English", short: "EN", native: "English", dir: "ltr", htmlLang: "en" },
  ur: { label: "اردو", short: "اردو", native: "اردو", dir: "rtl", htmlLang: "ur" },
};

export function isRtl(lang: Lang): boolean {
  return LANG_META[lang].dir === "rtl";
}

/** Which bilingual CMS / DB field set to use for this UI language. */
export function contentLang(lang: Lang): ContentLang {
  return lang === "en" ? "en" : "ar";
}

/** Swap the `/ar|/en|/ur` prefix on the current path. */
export function localePath(path: string, next: Lang, search = ""): string {
  const swapped = path.replace(/^\/(ar|en|ur)(?=\/|$)/, `/${next}`);
  const withLang = swapped.startsWith(`/${next}`) ? swapped : `/${next}${path.startsWith("/") ? path : `/${path}`}`;
  return withLang + (search ? (search.startsWith("?") ? search : `?${search}`) : "");
}

export function isLang(value: string | undefined): value is Lang {
  return value === "ar" || value === "en" || value === "ur";
}

/** Pick a bilingual catalogue string for the active UI language (Urdu → Arabic). */
export function pickBilingual(lang: Lang, ar: string, en: string): string {
  return contentLang(lang) === "en" ? en : ar;
}
