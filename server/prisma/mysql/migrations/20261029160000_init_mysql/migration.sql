-- CreateTable
CREATE TABLE `categories` (
    `id` CHAR(36) NOT NULL,
    `legacy_id` VARCHAR(100) NULL,
    `slug` VARCHAR(120) NOT NULL,
    `parent_id` CHAR(36) NULL,
    `name_ar` VARCHAR(200) NOT NULL,
    `name_en` VARCHAR(200) NOT NULL,
    `description_ar` VARCHAR(2000) NOT NULL DEFAULT '',
    `description_en` VARCHAR(2000) NOT NULL DEFAULT '',
    `image_url` VARCHAR(1000) NULL,
    `icon` VARCHAR(40) NOT NULL DEFAULT 'grid',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,
    `archived_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_legacy_id_key`(`legacy_id`),
    UNIQUE INDEX `categories_slug_key`(`slug`),
    INDEX `categories_parent_id_sort_order_idx`(`parent_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` CHAR(36) NOT NULL,
    `legacy_id` VARCHAR(100) NULL,
    `sku` VARCHAR(64) NULL,
    `slug` VARCHAR(160) NOT NULL,
    `category_id` CHAR(36) NULL,
    `name_ar` VARCHAR(300) NOT NULL,
    `name_en` VARCHAR(300) NOT NULL,
    `label_ar` VARCHAR(200) NOT NULL DEFAULT '',
    `label_en` VARCHAR(200) NOT NULL DEFAULT '',
    `description_ar` VARCHAR(4000) NOT NULL DEFAULT '',
    `description_en` VARCHAR(4000) NOT NULL DEFAULT '',
    `price` DECIMAL(12, 2) NOT NULL,
    `compare_at_price` DECIMAL(12, 2) NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'SAR',
    `stock_quantity` INTEGER NULL,
    `allow_backorder` BOOLEAN NOT NULL DEFAULT false,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,
    `show_in_home_offers` BOOLEAN NOT NULL DEFAULT false,
    `rating_average` DECIMAL(2, 1) NULL,
    `review_count` INTEGER NOT NULL DEFAULT 0,
    `archived_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_legacy_id_key`(`legacy_id`),
    UNIQUE INDEX `products_sku_key`(`sku`),
    UNIQUE INDEX `products_slug_key`(`slug`),
    INDEX `products_category_id_idx`(`category_id`),
    INDEX `products_is_visible_archived_at_idx`(`is_visible`, `archived_at`),
    INDEX `products_show_in_home_offers_idx`(`show_in_home_offers`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_images` (
    `id` CHAR(36) NOT NULL,
    `product_id` CHAR(36) NOT NULL,
    `url` VARCHAR(1000) NOT NULL,
    `alt_ar` VARCHAR(300) NOT NULL DEFAULT '',
    `alt_en` VARCHAR(300) NOT NULL DEFAULT '',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `product_images_product_id_sort_order_idx`(`product_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_movements` (
    `id` CHAR(36) NOT NULL,
    `product_id` CHAR(36) NOT NULL,
    `delta` INTEGER NOT NULL,
    `reason` ENUM('ORDER_PLACED', 'ORDER_CANCELLED', 'MANUAL_ADJUSTMENT', 'RESTOCK') NOT NULL,
    `order_id` CHAR(36) NULL,
    `admin_user_id` CHAR(36) NULL,
    `note` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_movements_product_id_created_at_idx`(`product_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` CHAR(36) NOT NULL,
    `full_name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(254) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `customers_phone_key`(`phone`),
    INDEX `customers_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `addresses` (
    `id` CHAR(36) NOT NULL,
    `customer_id` CHAR(36) NOT NULL,
    `zone_id` CHAR(36) NULL,
    `city` VARCHAR(80) NOT NULL,
    `line1` VARCHAR(200) NOT NULL,
    `notes` VARCHAR(500) NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `addresses_customer_id_idx`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shipping_zones` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(40) NOT NULL,
    `name_ar` VARCHAR(120) NOT NULL,
    `name_en` VARCHAR(120) NOT NULL DEFAULT '',
    `cities_ar` VARCHAR(1000) NOT NULL DEFAULT '',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `shipping_zones_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shipping_methods` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(40) NOT NULL,
    `name_ar` VARCHAR(120) NOT NULL,
    `name_en` VARCHAR(120) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `fee` DECIMAL(12, 2) NOT NULL,
    `free_over_amount` DECIMAL(12, 2) NULL,
    `min_order_amount` DECIMAL(12, 2) NULL,
    `eta_min_days` INTEGER NOT NULL DEFAULT 0,
    `eta_max_days` INTEGER NOT NULL DEFAULT 0,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `shipping_methods_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shipping_method_zones` (
    `method_id` CHAR(36) NOT NULL,
    `zone_id` CHAR(36) NOT NULL,

    INDEX `shipping_method_zones_zone_id_idx`(`zone_id`),
    PRIMARY KEY (`method_id`, `zone_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_methods` (
    `code` ENUM('COD', 'BANK_TRANSFER', 'ONLINE') NOT NULL,
    `name_ar` VARCHAR(120) NOT NULL,
    `name_en` VARCHAR(120) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `extra_fee` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `instructions_ar` VARCHAR(2000) NOT NULL DEFAULT '',
    `instructions_en` VARCHAR(2000) NOT NULL DEFAULT '',
    `public_config` JSON NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` CHAR(36) NOT NULL,
    `number` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` CHAR(36) NOT NULL,
    `status` ENUM('NEW', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'NEW',
    `payment_status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `payment_method` ENUM('COD', 'BANK_TRANSFER', 'ONLINE') NOT NULL,
    `customer_name` VARCHAR(120) NOT NULL,
    `customer_phone` VARCHAR(20) NOT NULL,
    `customer_email` VARCHAR(254) NULL,
    `zone_code` VARCHAR(40) NOT NULL,
    `zone_name` VARCHAR(120) NOT NULL,
    `city` VARCHAR(80) NOT NULL,
    `address_line` VARCHAR(200) NOT NULL,
    `notes` VARCHAR(500) NULL,
    `shipping_method_id` CHAR(36) NULL,
    `shipping_method_name` VARCHAR(120) NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'SAR',
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `shipping_fee` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `payment_fee` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `discount_total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `tax_total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(12, 2) NOT NULL,
    `locale` VARCHAR(5) NOT NULL DEFAULT 'ar',
    `placed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_number_key`(`number`),
    INDEX `orders_status_placed_at_idx`(`status`, `placed_at`),
    INDEX `orders_payment_status_idx`(`payment_status`),
    INDEX `orders_customer_id_placed_at_idx`(`customer_id`, `placed_at`),
    INDEX `orders_customer_phone_idx`(`customer_phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` CHAR(36) NOT NULL,
    `order_id` CHAR(36) NOT NULL,
    `product_id` CHAR(36) NULL,
    `product_name` VARCHAR(300) NOT NULL,
    `product_sku` VARCHAR(64) NULL,
    `image_url` VARCHAR(1000) NULL,
    `unit_price` DECIMAL(12, 2) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `line_total` DECIMAL(12, 2) NOT NULL,

    INDEX `order_items_order_id_idx`(`order_id`),
    INDEX `order_items_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_status_history` (
    `id` CHAR(36) NOT NULL,
    `order_id` CHAR(36) NOT NULL,
    `from_status` ENUM('NEW', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') NULL,
    `to_status` ENUM('NEW', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL,
    `note` VARCHAR(500) NULL,
    `changed_by_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `order_status_history_order_id_created_at_idx`(`order_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_status_history` (
    `id` CHAR(36) NOT NULL,
    `order_id` CHAR(36) NOT NULL,
    `from_status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NULL,
    `to_status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL,
    `note` VARCHAR(500) NULL,
    `changed_by_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payment_status_history_order_id_created_at_idx`(`order_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `home_sections` (
    `id` CHAR(36) NOT NULL,
    `key` VARCHAR(80) NOT NULL,
    `kind` ENUM('BUILT_IN', 'BANNER', 'PRODUCTS') NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,
    `content_ar` JSON NOT NULL,
    `content_en` JSON NOT NULL,
    `link` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `home_sections_key_key`(`key`),
    INDEX `home_sections_sort_order_idx`(`sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `home_section_products` (
    `section_id` CHAR(36) NOT NULL,
    `product_id` CHAR(36) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `home_section_products_product_id_idx`(`product_id`),
    PRIMARY KEY (`section_id`, `product_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hero_slides` (
    `id` CHAR(36) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `title_ar` VARCHAR(200) NOT NULL,
    `title_rest_ar` VARCHAR(200) NOT NULL DEFAULT '',
    `lead_ar` VARCHAR(1000) NOT NULL DEFAULT '',
    `title_en` VARCHAR(200) NOT NULL,
    `title_rest_en` VARCHAR(200) NOT NULL DEFAULT '',
    `lead_en` VARCHAR(1000) NOT NULL DEFAULT '',
    `image_url` VARCHAR(1000) NULL,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,
    `archived_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `hero_slides_sort_order_idx`(`sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `store_settings` (
    `key` VARCHAR(80) NOT NULL,
    `value` JSON NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_users` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `full_name` VARCHAR(120) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('OWNER', 'MANAGER', 'EDITOR', 'SUPPORT') NOT NULL DEFAULT 'EDITOR',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_sessions` (
    `id` CHAR(36) NOT NULL,
    `admin_user_id` CHAR(36) NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `user_agent` VARCHAR(300) NULL,
    `ip_address` VARCHAR(64) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admin_sessions_token_hash_key`(`token_hash`),
    INDEX `admin_sessions_admin_user_id_idx`(`admin_user_id`),
    INDEX `admin_sessions_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_admin_user_id_fkey` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_zone_id_fkey` FOREIGN KEY (`zone_id`) REFERENCES `shipping_zones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipping_method_zones` ADD CONSTRAINT `shipping_method_zones_method_id_fkey` FOREIGN KEY (`method_id`) REFERENCES `shipping_methods`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipping_method_zones` ADD CONSTRAINT `shipping_method_zones_zone_id_fkey` FOREIGN KEY (`zone_id`) REFERENCES `shipping_zones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_shipping_method_id_fkey` FOREIGN KEY (`shipping_method_id`) REFERENCES `shipping_methods`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_status_history` ADD CONSTRAINT `order_status_history_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_status_history` ADD CONSTRAINT `order_status_history_changed_by_id_fkey` FOREIGN KEY (`changed_by_id`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_status_history` ADD CONSTRAINT `payment_status_history_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_status_history` ADD CONSTRAINT `payment_status_history_changed_by_id_fkey` FOREIGN KEY (`changed_by_id`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `home_section_products` ADD CONSTRAINT `home_section_products_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `home_sections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `home_section_products` ADD CONSTRAINT `home_section_products_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_sessions` ADD CONSTRAINT `admin_sessions_admin_user_id_fkey` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- Rules Prisma cannot express in schema.prisma. Kept in this migration so every database gets them.
-- MySQL enforces CHECK constraints from 8.0.16 on.
-- ---------------------------------------------------------------------------

-- Order numbers continue after the dashboard's sample orders (#1042-#1048). MySQL 8 keeps this counter
-- across restarts; rolled-back orders leave gaps, as PostgreSQL sequences do.
ALTER TABLE `orders` AUTO_INCREMENT = 1049;

-- Money and quantities can never be negative.
ALTER TABLE `products`
  ADD CONSTRAINT `products_price_non_negative` CHECK (`price` >= 0),
  ADD CONSTRAINT `products_compare_at_non_negative` CHECK (`compare_at_price` IS NULL OR `compare_at_price` >= 0),
  ADD CONSTRAINT `products_stock_non_negative` CHECK (`stock_quantity` IS NULL OR `stock_quantity` >= 0),
  ADD CONSTRAINT `products_review_count_non_negative` CHECK (`review_count` >= 0),
  ADD CONSTRAINT `products_rating_range` CHECK (`rating_average` IS NULL OR (`rating_average` >= 0 AND `rating_average` <= 5)),
  -- Compared as bytes: the table collation ignores case, so a plain `currency = UPPER(currency)` always passes.
  ADD CONSTRAINT `products_currency_upper` CHECK (CAST(`currency` AS BINARY) = CAST(UPPER(`currency`) AS BINARY));

ALTER TABLE `shipping_methods`
  ADD CONSTRAINT `shipping_methods_fee_non_negative` CHECK (`fee` >= 0),
  ADD CONSTRAINT `shipping_methods_free_over_non_negative` CHECK (`free_over_amount` IS NULL OR `free_over_amount` >= 0),
  ADD CONSTRAINT `shipping_methods_min_order_non_negative` CHECK (`min_order_amount` IS NULL OR `min_order_amount` >= 0),
  ADD CONSTRAINT `shipping_methods_eta_range` CHECK (`eta_min_days` >= 0 AND `eta_max_days` >= `eta_min_days`);

ALTER TABLE `payment_methods`
  ADD CONSTRAINT `payment_methods_extra_fee_non_negative` CHECK (`extra_fee` >= 0);

ALTER TABLE `orders`
  ADD CONSTRAINT `orders_amounts_non_negative` CHECK (
    `subtotal` >= 0 AND `shipping_fee` >= 0 AND `payment_fee` >= 0 AND `discount_total` >= 0 AND `tax_total` >= 0 AND `total` >= 0
  ),
  ADD CONSTRAINT `orders_total_matches` CHECK (
    `total` = `subtotal` + `shipping_fee` + `payment_fee` + `tax_total` - `discount_total`
  );

ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_quantity_positive` CHECK (`quantity` > 0),
  ADD CONSTRAINT `order_items_unit_price_non_negative` CHECK (`unit_price` >= 0),
  ADD CONSTRAINT `order_items_line_total_matches` CHECK (`line_total` = `unit_price` * `quantity`);

ALTER TABLE `stock_movements`
  ADD CONSTRAINT `stock_movements_delta_not_zero` CHECK (`delta` <> 0);

-- A category cannot be its own parent. MySQL refuses CHECKs on a column whose foreign key cascades, which
-- is why categories_parent_id_fkey uses ON UPDATE RESTRICT (ids never change, so nothing is lost).
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_not_own_parent` CHECK (`parent_id` IS NULL OR `parent_id` <> `id`);

-- Admin emails are stored lower-case. Compared as bytes for the same reason as products_currency_upper.
ALTER TABLE `admin_users`
  ADD CONSTRAINT `admin_users_email_lowercase` CHECK (CAST(`email` AS BINARY) = CAST(LOWER(`email`) AS BINARY));

-- "One default address per customer" is enforced by the API, as in the PostgreSQL schema.
