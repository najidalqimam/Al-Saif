-- Urdu copy for products, and English becomes optional. Additive only: every existing row keeps its Arabic and English
-- text, and the new Urdu columns start empty (the storefront then shows the Arabic text in Urdu).
ALTER TABLE `products`
    ADD COLUMN `name_ur` VARCHAR(300) NOT NULL DEFAULT '',
    ADD COLUMN `label_ur` VARCHAR(200) NOT NULL DEFAULT '',
    ADD COLUMN `description_ur` VARCHAR(4000) NOT NULL DEFAULT '',
    ADD COLUMN `features_ur` JSON NULL,
    ADD COLUMN `specs_ur` JSON NULL,
    ALTER COLUMN `name_en` SET DEFAULT '';
