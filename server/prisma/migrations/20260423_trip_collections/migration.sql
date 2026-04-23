-- CreateTable
CREATE TABLE `trips` (
    `id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `cover_image_url` VARCHAR(191) NULL,
    `note` TEXT NOT NULL,
    `starts_at` DATETIME(3) NOT NULL,
    `ends_at` DATETIME(3) NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_trips_account_id`(`account_id`),
    INDEX `idx_trips_starts_at`(`starts_at`),
    UNIQUE INDEX `uq_trips_account_name_active`(`account_id`, `name`, `is_deleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `visit_markers`
  ADD COLUMN `trip_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `idx_visit_markers_trip_id` ON `visit_markers`(`trip_id`);

-- AddForeignKey
ALTER TABLE `trips`
  ADD CONSTRAINT `trips_account_id_fkey`
  FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_markers`
  ADD CONSTRAINT `visit_markers_trip_id_fkey`
  FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
