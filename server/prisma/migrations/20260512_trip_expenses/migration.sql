CREATE TABLE `trip_expenses` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `trip_id` VARCHAR(191) NOT NULL,
  `companion_id` VARCHAR(191) NULL,
  `source_planning_item_id` VARCHAR(191) NULL,
  `title` VARCHAR(191) NOT NULL,
  `category` VARCHAR(191) NOT NULL,
  `amount_cents` INTEGER NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'CNY',
  `spent_at` DATETIME(3) NOT NULL,
  `note` TEXT NULL,
  `status` ENUM('draft', 'actual') NOT NULL DEFAULT 'actual',
  `is_deleted` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  `deleted_at` DATETIME(3) NULL,

  INDEX `idx_trip_expenses_account_id`(`account_id`),
  INDEX `idx_trip_expenses_trip_id`(`trip_id`),
  INDEX `idx_trip_expenses_companion_id`(`companion_id`),
  INDEX `idx_trip_expenses_source_planning_item_id`(`source_planning_item_id`),
  INDEX `idx_trip_expenses_spent_at`(`spent_at`),
  INDEX `idx_trip_expenses_status`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `trip_expenses`
  ADD CONSTRAINT `trip_expenses_account_id_fkey`
  FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `trip_expenses`
  ADD CONSTRAINT `trip_expenses_trip_id_fkey`
  FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `trip_expenses`
  ADD CONSTRAINT `trip_expenses_companion_id_fkey`
  FOREIGN KEY (`companion_id`) REFERENCES `travel_companions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
