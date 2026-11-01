-- Product page content edited from the dashboard. Additive only: existing rows keep NULL, and the
-- storefront shows its built-in copy until a value is saved.
ALTER TABLE `products`
    ADD COLUMN `features_ar` JSON NULL,
    ADD COLUMN `features_en` JSON NULL,
    ADD COLUMN `specs_ar` JSON NULL,
    ADD COLUMN `specs_en` JSON NULL;
