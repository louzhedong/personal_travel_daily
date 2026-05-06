-- AlterTable
ALTER TABLE `guide_search_histories` ADD COLUMN `last_result_count` INTEGER NULL;

-- AlterTable
ALTER TABLE `trip_checklist_items` ALTER COLUMN `updated_at` DROP DEFAULT;

-- CreateTable
CREATE TABLE `guide_search_logs` (
    `id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `companion_id` VARCHAR(191) NOT NULL,
    `keyword` VARCHAR(191) NOT NULL,
    `keyword_normalized` VARCHAR(191) NOT NULL,
    `scope` ENUM('domestic', 'international', 'all') NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `page` INTEGER NOT NULL,
    `page_size` INTEGER NOT NULL,
    `result_count` INTEGER NOT NULL,
    `has_more` BOOLEAN NOT NULL,
    `duration_ms` INTEGER NOT NULL,
    `status` ENUM('success', 'empty', 'error') NOT NULL,
    `error_code` VARCHAR(191) NULL,
    `source_name` VARCHAR(191) NULL,
    `source_domain` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_guide_search_logs_account_created`(`account_id`, `created_at`),
    INDEX `idx_guide_search_logs_keyword_created`(`keyword_normalized`, `created_at`),
    INDEX `idx_guide_search_logs_source_domain_created`(`source_domain`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guide_source_health` (
    `id` VARCHAR(191) NOT NULL,
    `source_name` VARCHAR(191) NOT NULL,
    `source_domain` VARCHAR(191) NOT NULL,
    `recent_success` INTEGER NOT NULL DEFAULT 0,
    `recent_failure` INTEGER NOT NULL DEFAULT 0,
    `last_success_at` DATETIME(3) NULL,
    `last_failure_at` DATETIME(3) NULL,
    `last_failure_reason` TEXT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uq_guide_source_health_name_domain`(`source_name`, `source_domain`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `guide_search_logs` ADD CONSTRAINT `guide_search_logs_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guide_search_logs` ADD CONSTRAINT `guide_search_logs_companion_id_fkey` FOREIGN KEY (`companion_id`) REFERENCES `travel_companions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

