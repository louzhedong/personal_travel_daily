CREATE TABLE `guide_source_preferences` (
  `id` VARCHAR(191) NOT NULL,
  `source_name` VARCHAR(191) NOT NULL,
  `source_domain` VARCHAR(191) NOT NULL,
  `priority_weight` INTEGER NOT NULL DEFAULT 0,
  `demotion_reason` TEXT NULL,
  `updated_by` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `uq_guide_source_preferences_name_domain`(`source_name`, `source_domain`),
  INDEX `idx_guide_source_preferences_priority`(`priority_weight`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `guide_quality_snapshots` (
  `id` VARCHAR(191) NOT NULL,
  `log_id` VARCHAR(191) NOT NULL,
  `source_name` VARCHAR(191) NULL,
  `source_domain` VARCHAR(191) NULL,
  `score` INTEGER NOT NULL,
  `level` VARCHAR(191) NOT NULL,
  `relevance_score` INTEGER NOT NULL,
  `completeness_score` INTEGER NOT NULL,
  `readability_score` INTEGER NOT NULL,
  `source_stability_score` INTEGER NOT NULL,
  `save_rate_score` INTEGER NOT NULL,
  `priority_weight` INTEGER NOT NULL DEFAULT 0,
  `reasons_json` JSON NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `guide_quality_snapshots_log_id_key`(`log_id`),
  INDEX `idx_guide_quality_snapshots_source_created`(`source_domain`, `created_at`),
  INDEX `idx_guide_quality_snapshots_score`(`score`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `guide_quality_snapshots`
  ADD CONSTRAINT `guide_quality_snapshots_log_id_fkey`
  FOREIGN KEY (`log_id`) REFERENCES `guide_search_logs`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
