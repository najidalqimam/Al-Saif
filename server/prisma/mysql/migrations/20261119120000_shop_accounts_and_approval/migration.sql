-- Shop accounts, product approval and shop payment details. Additive only: nothing is removed or rewritten.
-- Every existing product stays published (approval_status NULL), existing staff keep their roles, and every new
-- shop column starts with a default.

-- AlterTable
ALTER TABLE `admin_users` ADD COLUMN `shop_id` CHAR(36) NULL,
    MODIFY `role` ENUM('OWNER', 'MANAGER', 'EDITOR', 'SUPPORT', 'SHOP') NOT NULL DEFAULT 'EDITOR';

-- AlterTable
ALTER TABLE `products` ADD COLUMN `approval_status` ENUM('PENDING', 'REJECTED') NULL,
    ADD COLUMN `reject_reason` VARCHAR(500) NULL,
    ADD COLUMN `submitted_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `shops` ADD COLUMN `accepts_bank_transfer` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `accepts_cod` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `account_holder` VARCHAR(200) NOT NULL DEFAULT '',
    ADD COLUMN `account_number` VARCHAR(40) NOT NULL DEFAULT '',
    ADD COLUMN `bank_name` VARCHAR(120) NOT NULL DEFAULT '',
    ADD COLUMN `iban` VARCHAR(40) NOT NULL DEFAULT '',
    ADD COLUMN `payment_notes` VARCHAR(1000) NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX `admin_users_shop_id_idx` ON `admin_users`(`shop_id`);

-- CreateIndex
CREATE INDEX `products_approval_status_idx` ON `products`(`approval_status`);

-- AddForeignKey
ALTER TABLE `admin_users` ADD CONSTRAINT `admin_users_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
