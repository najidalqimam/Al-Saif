-- Shops can be suspended or archived (hidden from the store with their products). Additive only: every shop stays active.
ALTER TABLE `shops` ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `archived_at` DATETIME(3) NULL;
