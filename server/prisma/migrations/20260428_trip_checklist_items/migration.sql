-- Add trip checklist items for guide-to-checklist workflow.
CREATE TABLE `trip_checklist_items` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `trip_id` VARCHAR(191) NOT NULL,
  `created_by_companion_id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `note` TEXT NULL,
  `stage` ENUM('pre_departure', 'in_transit', 'done') NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `origin` VARCHAR(191) NOT NULL,
  `source_guide_identity` VARCHAR(191) NULL,
  `source_guide_title` VARCHAR(191) NULL,
  `source_guide_source_name` VARCHAR(191) NULL,
  `source_guide_source_url` VARCHAR(191) NULL,
  `source_snippet` TEXT NULL,
  `is_deleted` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,

  PRIMARY KEY (`id`),
  INDEX `idx_trip_checklist_items_account_id`(`account_id`),
  INDEX `idx_trip_checklist_items_trip_id`(`trip_id`),
  INDEX `idx_trip_checklist_items_trip_stage_sort`(`trip_id`, `stage`, `sort_order`),
  INDEX `idx_trip_checklist_items_trip_guide_identity_active`(`trip_id`, `source_guide_identity`, `is_deleted`),
  CONSTRAINT `trip_checklist_items_account_id_fkey`
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `trip_checklist_items_trip_id_fkey`
    FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `trip_checklist_items_created_by_companion_id_fkey`
    FOREIGN KEY (`created_by_companion_id`) REFERENCES `travel_companions`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
