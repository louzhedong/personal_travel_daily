-- CreateEnum
CREATE TABLE `wishlist_items` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `created_by_companion_id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `scope` ENUM('domestic', 'international') NOT NULL,
  `scope_id` VARCHAR(191) NOT NULL,
  `scope_name` VARCHAR(191) NOT NULL,
  `city` VARCHAR(191) NOT NULL,
  `note` TEXT NULL,
  `priority` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  `target_year` VARCHAR(191) NULL,
  `source_guide_identity` VARCHAR(191) NULL,
  `source_guide_title` VARCHAR(191) NULL,
  `source_guide_source_name` VARCHAR(191) NULL,
  `source_guide_source_url` VARCHAR(191) NULL,
  `is_deleted` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  `deleted_at` DATETIME(3) NULL,

  INDEX `idx_wishlist_items_account_id`(`account_id`),
  INDEX `idx_wishlist_items_companion_id`(`created_by_companion_id`),
  INDEX `idx_wishlist_items_scope_scope_id`(`scope`, `scope_id`),
  INDEX `idx_wishlist_items_target_year`(`target_year`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `wishlist_items` ADD CONSTRAINT `wishlist_items_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wishlist_items` ADD CONSTRAINT `wishlist_items_created_by_companion_id_fkey` FOREIGN KEY (`created_by_companion_id`) REFERENCES `travel_companions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
