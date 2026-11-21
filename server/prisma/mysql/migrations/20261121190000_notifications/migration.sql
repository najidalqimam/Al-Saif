-- Dashboard notifications (the bell). New table only; nothing existing is changed.
CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL,
    `shop_id` CHAR(36) NULL,
    `kind` VARCHAR(40) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `body` VARCHAR(500) NOT NULL DEFAULT '',
    `link` VARCHAR(200) NOT NULL DEFAULT '',
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_shop_id_created_at_idx`(`shop_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
