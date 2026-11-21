-- Extra permissions granted to one staff member on top of their role. Additive only: existing staff keep their role's permissions and the new column starts empty.
ALTER TABLE `admin_users`
    ADD COLUMN `extra_permissions` JSON NULL;
