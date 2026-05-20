CREATE TABLE `account_preferences` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `locale` VARCHAR(191) NOT NULL DEFAULT 'zh-CN',
  `map_style` VARCHAR(191) NOT NULL DEFAULT 'magazine',
  `default_currency` VARCHAR(191) NOT NULL DEFAULT 'CNY',
  `common_currencies` JSON NOT NULL,
  `exchange_rate_source` VARCHAR(191) NOT NULL DEFAULT 'exchangerate-host',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `account_preferences_account_id_key` (`account_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `home_dashboard_preferences` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `layout_json` JSON NOT NULL,
  `hidden_card_ids_json` JSON NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `home_dashboard_preferences_account_id_key` (`account_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `assistant_preferences` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `style` VARCHAR(191) NOT NULL DEFAULT 'magazine',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `assistant_preferences_account_id_key` (`account_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `assistant_suggestions` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `context_type` VARCHAR(191) NOT NULL,
  `context_id` VARCHAR(191) NULL,
  `style` VARCHAR(191) NOT NULL DEFAULT 'magazine',
  `prompt_summary` TEXT NOT NULL,
  `output_json` JSON NOT NULL,
  `status` ENUM('draft', 'confirmed', 'dismissed') NOT NULL DEFAULT 'draft',
  `confirmed_at` DATETIME(3) NULL,
  `target_kind` VARCHAR(191) NULL,
  `target_id` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `idx_assistant_suggestions_account_created` (`account_id`, `created_at`),
  INDEX `idx_assistant_suggestions_context` (`account_id`, `context_type`),
  INDEX `idx_assistant_suggestions_status` (`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `geo_lookups` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `query_key` VARCHAR(191) NOT NULL,
  `label` VARCHAR(191) NOT NULL,
  `scope` VARCHAR(191) NULL,
  `latitude` DECIMAL(10, 7) NOT NULL,
  `longitude` DECIMAL(10, 7) NOT NULL,
  `source` VARCHAR(191) NOT NULL,
  `confidence` INTEGER NOT NULL DEFAULT 80,
  `raw_json` JSON NULL,
  `resolved_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `uq_geo_lookups_account_query` (`account_id`, `query_key`),
  INDEX `idx_geo_lookups_account_id` (`account_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `trip_expenses`
  ADD COLUMN `paid_by_companion_id` VARCHAR(191) NULL,
  ADD COLUMN `original_amount_cents` INTEGER NULL,
  ADD COLUMN `original_currency` VARCHAR(191) NULL,
  ADD COLUMN `base_currency` VARCHAR(191) NULL,
  ADD COLUMN `exchange_rate` DECIMAL(18, 8) NULL,
  ADD COLUMN `exchange_rate_source` VARCHAR(191) NULL,
  ADD COLUMN `exchange_rate_at` DATETIME(3) NULL,
  ADD INDEX `idx_trip_expenses_paid_by_companion_id` (`paid_by_companion_id`);

CREATE TABLE `trip_expense_splits` (
  `id` VARCHAR(191) NOT NULL,
  `expense_id` VARCHAR(191) NOT NULL,
  `companion_id` VARCHAR(191) NOT NULL,
  `share_ratio` DECIMAL(12, 6) NOT NULL DEFAULT 1,
  `share_cents` INTEGER NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `uq_trip_expense_splits_expense_companion` (`expense_id`, `companion_id`),
  INDEX `idx_trip_expense_splits_companion_id` (`companion_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `exchange_rate_snapshots` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `from_currency` VARCHAR(191) NOT NULL,
  `to_currency` VARCHAR(191) NOT NULL,
  `rate` DECIMAL(18, 8) NOT NULL,
  `source` VARCHAR(191) NOT NULL,
  `fetched_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_exchange_rate_snapshots_lookup` (`account_id`, `from_currency`, `to_currency`, `fetched_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `visit_markers`
  ADD COLUMN `latitude` DECIMAL(10, 7) NULL,
  ADD COLUMN `longitude` DECIMAL(10, 7) NULL,
  ADD COLUMN `geo_source` VARCHAR(191) NULL,
  ADD COLUMN `geo_confidence` INTEGER NULL,
  ADD COLUMN `geo_resolved_at` DATETIME(3) NULL,
  ADD INDEX `idx_visit_markers_lat_lng` (`latitude`, `longitude`);

CREATE TABLE `guide_subscriptions` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `kind` ENUM('keyword', 'source', 'destination', 'rss') NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `keyword` VARCHAR(191) NULL,
  `source_name` VARCHAR(191) NULL,
  `destination` VARCHAR(191) NULL,
  `rss_url` TEXT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT true,
  `last_run_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `idx_guide_subscriptions_account_id` (`account_id`),
  INDEX `idx_guide_subscriptions_kind_enabled` (`kind`, `enabled`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `guide_subscription_runs` (
  `id` VARCHAR(191) NOT NULL,
  `subscription_id` VARCHAR(191) NOT NULL,
  `status` ENUM('success', 'partial', 'error') NOT NULL,
  `matched_count` INTEGER NOT NULL DEFAULT 0,
  `error_message` TEXT NULL,
  `started_at` DATETIME(3) NOT NULL,
  `finished_at` DATETIME(3) NULL,
  INDEX `idx_guide_subscription_runs_subscription_started` (`subscription_id`, `started_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `guide_subscription_items` (
  `id` VARCHAR(191) NOT NULL,
  `subscription_id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `source_name` VARCHAR(191) NULL,
  `source_url` TEXT NOT NULL,
  `source_hash` VARCHAR(191) NOT NULL,
  `summary` TEXT NULL,
  `published_at` DATETIME(3) NULL,
  `first_seen_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `saved_guide_id` VARCHAR(191) NULL,
  `wishlist_item_id` VARCHAR(191) NULL,
  `planning_item_id` VARCHAR(191) NULL,
  UNIQUE INDEX `uq_guide_subscription_items_subscription_hash` (`subscription_id`, `source_hash`),
  INDEX `idx_guide_subscription_items_subscription_seen` (`subscription_id`, `first_seen_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `account_preferences` ADD CONSTRAINT `account_preferences_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `home_dashboard_preferences` ADD CONSTRAINT `home_dashboard_preferences_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `assistant_preferences` ADD CONSTRAINT `assistant_preferences_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `assistant_suggestions` ADD CONSTRAINT `assistant_suggestions_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `geo_lookups` ADD CONSTRAINT `geo_lookups_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `trip_expenses` ADD CONSTRAINT `trip_expenses_paid_by_companion_id_fkey` FOREIGN KEY (`paid_by_companion_id`) REFERENCES `travel_companions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `trip_expense_splits` ADD CONSTRAINT `trip_expense_splits_expense_id_fkey` FOREIGN KEY (`expense_id`) REFERENCES `trip_expenses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `trip_expense_splits` ADD CONSTRAINT `trip_expense_splits_companion_id_fkey` FOREIGN KEY (`companion_id`) REFERENCES `travel_companions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `exchange_rate_snapshots` ADD CONSTRAINT `exchange_rate_snapshots_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `guide_subscriptions` ADD CONSTRAINT `guide_subscriptions_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `guide_subscription_runs` ADD CONSTRAINT `guide_subscription_runs_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `guide_subscriptions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `guide_subscription_items` ADD CONSTRAINT `guide_subscription_items_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `guide_subscriptions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
