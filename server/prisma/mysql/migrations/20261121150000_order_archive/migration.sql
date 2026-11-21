-- Orders can be moved to an archive in the dashboard. Additive only: existing orders stay un-archived (NULL).
ALTER TABLE `orders` ADD COLUMN `archived_at` DATETIME(3) NULL;
