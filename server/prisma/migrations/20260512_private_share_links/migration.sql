-- CreateTable
CREATE TABLE `private_share_links` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `resource_type` ENUM('trip_story', 'annual_review', 'companion_memory', 'memory_capsule') NOT NULL,
  `resource_id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `token_hash` VARCHAR(191) NOT NULL,
  `token_preview` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(191) NULL,
  `expires_at` DATETIME(3) NULL,
  `max_access_count` INTEGER NULL,
  `access_count` INTEGER NOT NULL DEFAULT 0,
  `revoked_at` DATETIME(3) NULL,
  `last_accessed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `private_share_links_token_hash_key`(`token_hash`),
  INDEX `idx_private_share_links_account_id`(`account_id`),
  INDEX `idx_private_share_links_account_resource`(`account_id`, `resource_type`),
  INDEX `idx_private_share_links_resource`(`resource_type`, `resource_id`),
  INDEX `idx_private_share_links_expires_at`(`expires_at`),
  INDEX `idx_private_share_links_revoked_at`(`revoked_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `private_share_access_logs` (
  `id` VARCHAR(191) NOT NULL,
  `share_link_id` VARCHAR(191) NOT NULL,
  `success` BOOLEAN NOT NULL DEFAULT false,
  `failure_reason` VARCHAR(191) NULL,
  `ip_address` VARCHAR(191) NULL,
  `user_agent` TEXT NULL,
  `accessed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `idx_private_share_access_logs_link_time`(`share_link_id`, `accessed_at`),
  INDEX `idx_private_share_access_logs_accessed_at`(`accessed_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `private_share_links` ADD CONSTRAINT `private_share_links_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `private_share_access_logs` ADD CONSTRAINT `private_share_access_logs_share_link_id_fkey` FOREIGN KEY (`share_link_id`) REFERENCES `private_share_links`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
