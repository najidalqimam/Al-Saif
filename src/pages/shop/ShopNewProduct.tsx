import { useMemo } from "react";
import { useSiteContent } from "@/lib/site-content";
import { AddProductPage, type ShopMode } from "../admin/Products";
import { DemoNote } from "../admin/ui";

/**
 * The shop adds a product with the same page the admin uses (same fields, same leave prompt), except that it is sent
 * to the admin for approval and stays hidden from the store until the admin approves it.
 */
export function ShopNewProduct({ shopId, onDone, registerGuard }: { shopId: string; onDone: () => void; registerGuard: ShopMode["registerGuard"] }) {
  const { submitProduct } = useSiteContent();
  const shopMode = useMemo<ShopMode>(() => ({ submit: submitProduct, registerGuard }), [submitProduct, registerGuard]);
  return (
    <div className="space-y-6">
      <DemoNote title="يحتاج موافقة الإدارة">المنتجات اللي تضيفها من لوحة المحل تنتظر موافقة الإدارة قبل ما تنزل في المتجر. تتابع حالتها من «منتجاتي والمخزون».</DemoNote>
      <AddProductPage defaultCategory={null} defaultShopId={shopId} onClose={onDone} onAdded={() => undefined} shopMode={shopMode} />
    </div>
  );
}
