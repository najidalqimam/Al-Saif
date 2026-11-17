-- Urdu name and description for departments and subcategories. Additive only: every existing row keeps its Arabic and
-- English text, and the new columns start empty (the storefront then uses its built-in Urdu name, or the Arabic one).
ALTER TABLE `categories`
    ADD COLUMN `name_ur` VARCHAR(200) NOT NULL DEFAULT '',
    ADD COLUMN `description_ur` VARCHAR(2000) NOT NULL DEFAULT '';
