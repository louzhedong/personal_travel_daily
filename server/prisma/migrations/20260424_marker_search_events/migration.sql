-- CreateTable
CREATE TABLE `marker_search_events` (
    `id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `companion_id` VARCHAR(191) NULL,
    `keyword` VARCHAR(191) NOT NULL,
    `scope` ENUM('domestic', 'international', 'all') NOT NULL,
    `year` VARCHAR(191) NULL,
    `result_count` INTEGER NOT NULL,
    `page` INTEGER NOT NULL,
    `page_size` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_marker_search_events_account_id`(`account_id`),
    INDEX `idx_marker_search_events_companion_id`(`companion_id`),
    INDEX `idx_marker_search_events_created_at`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `marker_search_events`
  ADD CONSTRAINT `marker_search_events_account_id_fkey`
  FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marker_search_events`
  ADD CONSTRAINT `marker_search_events_companion_id_fkey`
  FOREIGN KEY (`companion_id`) REFERENCES `travel_companions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
