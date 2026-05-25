-- Batch 2 Features: G1 Wishlist Mood Board / G2 Trip Reconciliation / G3 Recall Event Index / G4 Contribution Drop-Box / G5 Rhythm Portrait
-- 第二批五大高收益功能数据迁移

-- G1: wishlist_items.mood_card_count
ALTER TABLE `wishlist_items`
  ADD COLUMN `mood_card_count` INTEGER NOT NULL DEFAULT 0;

-- G1: wishlist mood board cards
CREATE TABLE `wishlist_mood_cards` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `wishlist_item_id` VARCHAR(191) NOT NULL,
  `kind` ENUM('image', 'quote', 'note', 'season', 'budget') NOT NULL,
  `image_media_id` VARCHAR(191) NULL,
  `quote_text` TEXT NULL,
  `note_text` TEXT NULL,
  `season_window` VARCHAR(191) NULL,
  `budget_cents` INTEGER NULL,
  `currency` VARCHAR(191) NULL DEFAULT 'CNY',
  `position_x` INTEGER NOT NULL DEFAULT 0,
  `position_y` INTEGER NOT NULL DEFAULT 0,
  `color_tag` VARCHAR(191) NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `idx_wishlist_mood_cards_account_id` (`account_id`),
  INDEX `idx_wishlist_mood_cards_wishlist_id` (`wishlist_item_id`),
  INDEX `idx_wishlist_mood_cards_wishlist_sort` (`wishlist_item_id`, `sort_order`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- G2: trip reconciliation reports
CREATE TABLE `trip_reconciliation_reports` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `trip_id` VARCHAR(191) NOT NULL,
  `generated_at` DATETIME(3) NOT NULL,
  `plan_vs_marker_coverage` INTEGER NOT NULL,
  `checklist_completion_rate` INTEGER NOT NULL,
  `budget_variance_cents` INTEGER NOT NULL DEFAULT 0,
  `budget_planned_cents` INTEGER NOT NULL DEFAULT 0,
  `budget_actual_cents` INTEGER NOT NULL DEFAULT 0,
  `unconverted_planning_item_ids` JSON NOT NULL,
  `missing_caption_photo_count` INTEGER NOT NULL DEFAULT 0,
  `summary_markdown` TEXT NOT NULL,
  `acknowledged_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `trip_reconciliation_reports_trip_id_key` (`trip_id`),
  INDEX `idx_trip_reconciliation_reports_account_id` (`account_id`),
  INDEX `idx_trip_reconciliation_reports_acknowledged_at` (`acknowledged_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- G3: recall event index (derived, rebuildable)
CREATE TABLE `recall_event_index` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `event_date` DATETIME(3) NOT NULL,
  `kind` ENUM('marker', 'photo', 'expense', 'journal', 'guide') NOT NULL,
  `source_id` VARCHAR(191) NOT NULL,
  `trip_id` VARCHAR(191) NULL,
  `companion_ids` JSON NOT NULL,
  `weather` VARCHAR(191) NULL,
  `mood` VARCHAR(191) NULL,
  `latitude` DECIMAL(10, 7) NULL,
  `longitude` DECIMAL(10, 7) NULL,
  `tag_slugs` JSON NOT NULL,
  `title` VARCHAR(191) NULL,
  `city` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `uq_recall_event_index_account_kind_source` (`account_id`, `kind`, `source_id`),
  INDEX `idx_recall_event_index_account_date` (`account_id`, `event_date`),
  INDEX `idx_recall_event_index_account_kind` (`account_id`, `kind`),
  INDEX `idx_recall_event_index_trip_id` (`trip_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- G4: contribution drop boxes
CREATE TABLE `contribution_drop_boxes` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `trip_id` VARCHAR(191) NULL,
  `title` VARCHAR(191) NOT NULL,
  `token_hash` VARCHAR(191) NOT NULL,
  `token_preview` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `accept_kind` ENUM('photo', 'note', 'both') NOT NULL DEFAULT 'both',
  `expires_at` DATETIME(3) NOT NULL,
  `revoked_at` DATETIME(3) NULL,
  `max_uploads` INTEGER NOT NULL DEFAULT 50,
  `used_count` INTEGER NOT NULL DEFAULT 0,
  `note` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `contribution_drop_boxes_token_hash_key` (`token_hash`),
  UNIQUE INDEX `contribution_drop_boxes_slug_key` (`slug`),
  INDEX `idx_contribution_drop_boxes_account_id` (`account_id`),
  INDEX `idx_contribution_drop_boxes_trip_id` (`trip_id`),
  INDEX `idx_contribution_drop_boxes_expires_at` (`expires_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- G4: contribution inbox items
CREATE TABLE `contribution_inbox_items` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `drop_box_id` VARCHAR(191) NOT NULL,
  `submitted_at` DATETIME(3) NOT NULL,
  `kind` ENUM('photo', 'note') NOT NULL,
  `image_path` TEXT NULL,
  `image_byte_size` INTEGER NULL,
  `image_mime_type` VARCHAR(191) NULL,
  `note_text` TEXT NULL,
  `submitter_display_name` VARCHAR(191) NULL,
  `event_date` DATETIME(3) NULL,
  `status` ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  `accepted_as_type` ENUM('marker', 'photo', 'journal', 'note') NULL,
  `accepted_as_id` VARCHAR(191) NULL,
  `reviewed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `idx_contribution_inbox_items_account_id` (`account_id`),
  INDEX `idx_contribution_inbox_items_drop_box_id` (`drop_box_id`),
  INDEX `idx_contribution_inbox_items_account_status` (`account_id`, `status`),
  INDEX `idx_contribution_inbox_items_submitted_at` (`submitted_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- G5: rhythm portrait snapshots
CREATE TABLE `rhythm_portrait_snapshots` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `generated_at` DATETIME(3) NOT NULL,
  `window_years` VARCHAR(191) NOT NULL,
  `top_months` JSON NOT NULL,
  `top_transports` JSON NOT NULL,
  `avg_trip_days` DECIMAL(8, 2) NOT NULL,
  `budget_tier` VARCHAR(191) NOT NULL,
  `theme_mix` JSON NOT NULL,
  `companion_diversity_index` DECIMAL(8, 4) NOT NULL,
  `total_trip_count` INTEGER NOT NULL DEFAULT 0,
  `total_marker_count` INTEGER NOT NULL DEFAULT 0,
  `summary_markdown` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `uq_rhythm_portrait_snapshots_account` (`account_id`),
  INDEX `idx_rhythm_portrait_snapshots_generated_at` (`generated_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
