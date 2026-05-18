CREATE TABLE `marker_tag_vocabularies` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `value` VARCHAR(64) NOT NULL,
  `label` VARCHAR(50) NOT NULL,
  `source` VARCHAR(20) NOT NULL DEFAULT 'custom',
  `is_hidden` BOOLEAN NOT NULL DEFAULT false,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  INDEX `idx_marker_tag_vocabularies_account_id`(`account_id`),
  INDEX `idx_marker_tag_vocabularies_account_order`(`account_id`, `is_hidden`, `sort_order`),
  UNIQUE INDEX `uq_marker_tag_vocabularies_account_value`(`account_id`, `value`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `marker_tag_vocabularies`
  ADD CONSTRAINT `marker_tag_vocabularies_account_id_fkey`
  FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
