-- Shops and the optional link from a product to its shop. Additive only: no existing row is changed, and
-- every current product keeps shop_id NULL (not linked to any shop).
CREATE TABLE `shops` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `products` ADD COLUMN `shop_id` CHAR(36) NULL;

CREATE INDEX `products_shop_id_idx` ON `products`(`shop_id`);

ALTER TABLE `products` ADD CONSTRAINT `products_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
