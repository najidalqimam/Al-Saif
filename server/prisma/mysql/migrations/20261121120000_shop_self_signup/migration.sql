-- Shops that sign up by themselves wait for the admin. Additive only: existing shops get NULL, which means approved.
ALTER TABLE `shops` ADD COLUMN `approval_status` ENUM('PENDING', 'REJECTED') NULL,
    ADD COLUMN `reject_reason` VARCHAR(500) NULL;
