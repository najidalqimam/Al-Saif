import type { Lang } from "@/lib/i18n";
import { useSiteContent, type SiteContent } from "@/lib/site-content";
import { BilingualField } from "./ui";

export type BlockKey = "catalog" | "deals" | "bestsellers" | "addons" | "setups" | "footer";

export const BLOCK_LABELS: Record<BlockKey, Record<string, string>> = {
  catalog: { title: "العنوان", subtitle: "الوصف" },
  deals: { eyebrow: "السطر الصغير", title: "العنوان", highlight: "جملة الخصم", lead: "الوصف" },
  bestsellers: { eyebrow: "السطر الصغير", title: "العنوان", lead: "الوصف", bannerTitle: "عنوان شريط التجهيز", bannerLead: "وصف شريط التجهيز" },
  addons: { eyebrow: "السطر الصغير", title: "العنوان", lead: "الوصف", ready: "سطر الجاهزية" },
  setups: { eyebrow: "السطر الصغير", title: "العنوان", lead: "الوصف", action: "نص الزر" },
  footer: { about: "نبذة المتجر", shipping: "سطر الشحن", warranty: "سطر الضمان" },
};

/** Arabic and English fields for one home page text block; every keystroke saves. */
export function BlockFields({ block }: { block: BlockKey }) {
  const { content, updateBlock } = useSiteContent();
  const arabic = content[block].ar as Record<string, string>;
  const english = content[block].en as Record<string, string>;

  return (
    <div className="space-y-5">
      {Object.entries(BLOCK_LABELS[block]).map(([field, label]) => {
        const ar = arabic[field] ?? "";
        const en = english[field] ?? "";
        return (
          <BilingualField
            key={field}
            label={label}
            ar={ar}
            en={en}
            multiline={ar.length > 40 || en.length > 40}
            onAr={(value) => updateBlock(block, "ar", { [field]: value } as Partial<SiteContent[BlockKey][Lang]>)}
            onEn={(value) => updateBlock(block, "en", { [field]: value } as Partial<SiteContent[BlockKey][Lang]>)}
          />
        );
      })}
    </div>
  );
}
