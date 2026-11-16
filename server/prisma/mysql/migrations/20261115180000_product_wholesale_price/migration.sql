-- Optional wholesale price per piece for a product listing. Additive only: no existing row is changed, and every current
-- product keeps wholesale_price NULL (no wholesale price).
ALTER TABLE `products` ADD COLUMN `wholesale_price` DECIMAL(12, 2) NULL;
