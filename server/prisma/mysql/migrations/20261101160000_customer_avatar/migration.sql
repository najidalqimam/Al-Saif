-- The avatar a customer picks on the account page: the id of one of the storefront's preset avatars.
-- Additive: existing customers keep NULL and see the default icon.
ALTER TABLE `customers` ADD COLUMN `avatar` VARCHAR(40) NULL;
