-- CreateEnum
CREATE TABLE IF NOT EXISTS `trip_planning_items` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `trip_id` VARCHAR(191) NOT NULL,
  `created_by_companion_id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `scope` ENUM('domestic', 'international') NOT NULL,
  `scope_id` VARCHAR(191) NOT NULL,
  `scope_name` VARCHAR(191) NOT NULL,
  `city` VARCHAR(191) NOT NULL,
  `note` TEXT NULL,
  `priority` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  `planned_date` DATETIME(3) NULL,
  `status` ENUM('planned', 'converted') NOT NULL DEFAULT 'planned',
  `converted_marker_id` VARCHAR(191) NULL,
  `source_guide_identity` VARCHAR(191) NULL,
  `source_guide_title` VARCHAR(191) NULL,
  `source_guide_source_name` VARCHAR(191) NULL,
  `source_guide_source_url` VARCHAR(191) NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_deleted` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  `deleted_at` DATETIME(3) NULL,

  INDEX `idx_trip_planning_items_account_id`(`account_id`),
  INDEX `idx_trip_planning_items_trip_id`(`trip_id`),
  INDEX `idx_trip_planning_items_trip_status_sort`(`trip_id`, `status`, `sort_order`),
  INDEX `idx_trip_planning_items_companion_id`(`created_by_companion_id`),
  INDEX `idx_trip_planning_items_converted_marker_id`(`converted_marker_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `trip_planning_items`
  ADD CONSTRAINT `trip_planning_items_account_id_fkey`
  FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `trip_planning_items`
  ADD CONSTRAINT `trip_planning_items_trip_id_fkey`
  FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `trip_planning_items`
  ADD CONSTRAINT `trip_planning_items_created_by_companion_id_fkey`
  FOREIGN KEY (`created_by_companion_id`) REFERENCES `travel_companions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `trip_planning_items`
  ADD CONSTRAINT `trip_planning_items_converted_marker_id_fkey`
  FOREIGN KEY (`converted_marker_id`) REFERENCES `visit_markers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
