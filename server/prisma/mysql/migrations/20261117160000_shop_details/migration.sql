-- Contact details and a description for shops. Additive only: existing shops keep their name and every new column starts empty.
ALTER TABLE `shops`
    ADD COLUMN `owner_name` VARCHAR(200) NOT NULL DEFAULT '',
    ADD COLUMN `phone` VARCHAR(40) NOT NULL DEFAULT '',
    ADD COLUMN `email` VARCHAR(200) NOT NULL DEFAULT '',
    ADD COLUMN `city` VARCHAR(120) NOT NULL DEFAULT '',
    ADD COLUMN `address` VARCHAR(500) NOT NULL DEFAULT '',
    ADD COLUMN `description` VARCHAR(2000) NOT NULL DEFAULT '';
