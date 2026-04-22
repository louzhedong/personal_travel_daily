ALTER TABLE `accounts`
  ADD COLUMN `username` VARCHAR(191) NOT NULL DEFAULT 'demo',
  ADD COLUMN `password_hash` VARCHAR(191) NOT NULL DEFAULT '';

CREATE UNIQUE INDEX `accounts_username_key` ON `accounts`(`username`);

CREATE TABLE `auth_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `token_hash` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `auth_sessions_token_hash_key`(`token_hash`),
    INDEX `idx_auth_sessions_account_id`(`account_id`),
    INDEX `idx_auth_sessions_expires_at`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `auth_sessions`
  ADD CONSTRAINT `auth_sessions_account_id_fkey`
  FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
