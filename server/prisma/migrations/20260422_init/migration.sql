-- CreateTable
CREATE TABLE `accounts` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `travel_companions` (
    `id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_travel_companions_account_id`(`account_id`),
    UNIQUE INDEX `uq_travel_companions_account_name_active`(`account_id`, `name`, `is_deleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_markers` (
    `id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `companion_id` VARCHAR(191) NOT NULL,
    `scope` ENUM('domestic', 'international') NOT NULL,
    `scope_id` VARCHAR(191) NOT NULL,
    `scope_name` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `note` TEXT NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `visited_start_at` DATETIME(3) NOT NULL,
    `visited_end_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_visit_markers_account_id`(`account_id`),
    INDEX `idx_visit_markers_companion_id`(`companion_id`),
    INDEX `idx_visit_markers_scope_scope_id`(`scope`, `scope_id`),
    INDEX `idx_visit_markers_visited_start_at`(`visited_start_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_marker_images` (
    `id` VARCHAR(191) NOT NULL,
    `marker_id` VARCHAR(191) NOT NULL,
    `image_url` VARCHAR(191) NOT NULL,
    `sort_order` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_visit_marker_images_marker_id`(`marker_id`),
    UNIQUE INDEX `uq_visit_marker_images_marker_sort_order`(`marker_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saved_guides` (
    `id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `saved_by_companion_id` VARCHAR(191) NOT NULL,
    `marker_id` VARCHAR(191) NULL,
    `save_context_key` VARCHAR(191) NOT NULL,
    `keyword` VARCHAR(191) NOT NULL,
    `guide_identity` VARCHAR(191) NOT NULL,
    `guide_title` VARCHAR(191) NOT NULL,
    `guide_summary` TEXT NOT NULL,
    `guide_source_name` VARCHAR(191) NOT NULL,
    `guide_source_url` VARCHAR(191) NOT NULL,
    `guide_cover_image_url` VARCHAR(191) NULL,
    `guide_author_name` VARCHAR(191) NULL,
    `guide_published_at` DATETIME(3) NULL,
    `guide_destination_label` VARCHAR(191) NULL,
    `guide_payload_json` JSON NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `saved_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_saved_guides_account_id`(`account_id`),
    INDEX `idx_saved_guides_companion_id`(`saved_by_companion_id`),
    INDEX `idx_saved_guides_marker_id`(`marker_id`),
    UNIQUE INDEX `uq_saved_guides_context_identity_active`(`saved_by_companion_id`, `save_context_key`, `guide_identity`, `is_deleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guide_search_histories` (
    `id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `companion_id` VARCHAR(191) NOT NULL,
    `keyword` VARCHAR(191) NOT NULL,
    `keyword_normalized` VARCHAR(191) NOT NULL,
    `scope` ENUM('domestic', 'international', 'all') NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_guide_search_histories_account_id`(`account_id`),
    INDEX `idx_guide_search_histories_companion_id`(`companion_id`),
    UNIQUE INDEX `uq_guide_search_histories_scope_keyword_active`(`companion_id`, `keyword_normalized`, `scope`, `is_deleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `travel_companions` ADD CONSTRAINT `travel_companions_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_markers` ADD CONSTRAINT `visit_markers_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_markers` ADD CONSTRAINT `visit_markers_companion_id_fkey` FOREIGN KEY (`companion_id`) REFERENCES `travel_companions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_marker_images` ADD CONSTRAINT `visit_marker_images_marker_id_fkey` FOREIGN KEY (`marker_id`) REFERENCES `visit_markers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_guides` ADD CONSTRAINT `saved_guides_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_guides` ADD CONSTRAINT `saved_guides_saved_by_companion_id_fkey` FOREIGN KEY (`saved_by_companion_id`) REFERENCES `travel_companions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_guides` ADD CONSTRAINT `saved_guides_marker_id_fkey` FOREIGN KEY (`marker_id`) REFERENCES `visit_markers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guide_search_histories` ADD CONSTRAINT `guide_search_histories_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guide_search_histories` ADD CONSTRAINT `guide_search_histories_companion_id_fkey` FOREIGN KEY (`companion_id`) REFERENCES `travel_companions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

