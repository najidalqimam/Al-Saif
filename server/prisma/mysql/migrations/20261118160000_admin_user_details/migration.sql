-- Contact phone and job title for dashboard staff. Additive only: existing staff keep everything and the new columns start empty.
ALTER TABLE `admin_users`
    ADD COLUMN `phone` VARCHAR(40) NOT NULL DEFAULT '',
    ADD COLUMN `job_title` VARCHAR(120) NOT NULL DEFAULT '';
