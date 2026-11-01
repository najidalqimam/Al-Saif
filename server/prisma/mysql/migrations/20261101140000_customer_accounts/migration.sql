-- Customer accounts (mobile + password login, required email), customer sessions, a welcome-email outbox,
-- address labels, guest orders without a customer link, and real order numbers from 1001.
--
-- The customers and orders tables are empty when this runs: the new NOT NULL customer columns have no
-- default on purpose, so the migration stops instead of inventing names or passwords if rows ever exist.

-- DropIndex
DROP INDEX `customers_email_idx` ON `customers`;

-- AlterTable
ALTER TABLE `addresses` ADD COLUMN `label` VARCHAR(60) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE `customers` ADD COLUMN `first_name` VARCHAR(60) NOT NULL,
    ADD COLUMN `last_login_at` DATETIME(3) NULL,
    ADD COLUMN `last_name` VARCHAR(60) NOT NULL,
    ADD COLUMN `password_hash` VARCHAR(255) NOT NULL,
    MODIFY `email` VARCHAR(254) NOT NULL;

-- AlterTable
ALTER TABLE `orders` MODIFY `customer_id` CHAR(36) NULL;

-- CreateTable
CREATE TABLE `customer_sessions` (
    `id` CHAR(36) NOT NULL,
    `customer_id` CHAR(36) NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `user_agent` VARCHAR(300) NULL,
    `ip_address` VARCHAR(64) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `customer_sessions_token_hash_key`(`token_hash`),
    INDEX `customer_sessions_customer_id_idx`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_outbox` (
    `id` CHAR(36) NOT NULL,
    `customer_id` CHAR(36) NULL,
    `kind` ENUM('WELCOME') NOT NULL,
    `to_address` VARCHAR(254) NOT NULL,
    `locale` VARCHAR(5) NOT NULL DEFAULT 'ar',
    `status` ENUM('PENDING', 'SENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `last_error` VARCHAR(500) NULL,
    `next_attempt_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sent_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `email_outbox_status_next_attempt_at_idx`(`status`, `next_attempt_at`),
    UNIQUE INDEX `email_outbox_customer_id_kind_key`(`customer_id`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `customers_email_key` ON `customers`(`email`);

-- AddForeignKey
ALTER TABLE `customer_sessions` ADD CONSTRAINT `customer_sessions_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_outbox` ADD CONSTRAINT `email_outbox_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


-- Order numbers seen in the dashboard start at 1001 (the old 1049 start only followed the browser samples).
-- InnoDB applies this only while no order has a number at or above it, i.e. on the empty table.
ALTER TABLE `orders` AUTO_INCREMENT = 1001;
