-- Catalogue import and dashboard safety:
-- - products.sort_order keeps the order products are listed in today.
-- - (product_id, url) is unique, so re-running the catalogue import can never duplicate an image.
-- - Products referenced by orders, and categories that still hold products, can no longer be deleted
--   (ON DELETE RESTRICT). The API archives with archived_at instead of deleting.

-- DropForeignKey
ALTER TABLE `order_items` DROP FOREIGN KEY `order_items_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_category_id_fkey`;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `sort_order` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX `product_images_product_id_url_key` ON `product_images`(`product_id`, `url`(255));

-- CreateIndex
CREATE INDEX `products_sort_order_idx` ON `products`(`sort_order`);

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

