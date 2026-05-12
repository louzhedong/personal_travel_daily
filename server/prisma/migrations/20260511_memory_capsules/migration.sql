-- CreateTable
CREATE TABLE `memory_capsules` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `type` ENUM('trip', 'annual', 'companion') NOT NULL,
  `target_id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `subtitle` TEXT NULL,
  `template` VARCHAR(191) NOT NULL DEFAULT 'editorial',
  `status` ENUM('draft', 'ready', 'archived') NOT NULL DEFAULT 'draft',
  `config_json` JSON NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  `archived_at` DATETIME(3) NULL,

  INDEX `idx_memory_capsules_account_id`(`account_id`),
  INDEX `idx_memory_capsules_account_type`(`account_id`, `type`),
  INDEX `idx_memory_capsules_target_id`(`target_id`),
  INDEX `idx_memory_capsules_updated_at`(`updated_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `memory_capsules` ADD CONSTRAINT `memory_capsules_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
