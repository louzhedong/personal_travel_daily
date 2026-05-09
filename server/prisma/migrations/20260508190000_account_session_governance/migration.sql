ALTER TABLE `auth_sessions`
  ADD COLUMN `user_agent` TEXT NULL,
  ADD COLUMN `ip_address` VARCHAR(191) NULL,
  ADD COLUMN `last_seen_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `revoked_at` DATETIME(3) NULL;

CREATE INDEX `idx_auth_sessions_last_seen_at` ON `auth_sessions`(`last_seen_at`);
CREATE INDEX `idx_auth_sessions_revoked_at` ON `auth_sessions`(`revoked_at`);
