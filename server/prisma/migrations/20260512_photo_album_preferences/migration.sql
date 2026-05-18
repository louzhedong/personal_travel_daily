CREATE TABLE `photo_album_preferences` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `target_kind` VARCHAR(191) NOT NULL,
  `target_id` VARCHAR(191) NOT NULL,
  `pinned_image_ids` JSON NOT NULL,
  `sort_order_json` JSON NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  INDEX `idx_photo_album_preferences_account_id`(`account_id`),
  UNIQUE INDEX `uq_photo_album_preferences_target`(`account_id`, `target_kind`, `target_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `photo_album_preferences`
  ADD CONSTRAINT `photo_album_preferences_account_id_fkey`
  FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
