import type { Lang, Translations } from "@/lib/i18n";

/** Shop names are brand names and stay as typed; only the Arabic "demo shop" prefix is translated for Urdu. */
export function shopLabel(name: string, lang: Lang, t: Translations): string {
  if (lang !== "ur") return name;
  return name.replace(/^محل تجريبي(?=\s*:)/, t.compare.demoShopPrefix);
}
