-- Five Major Features: F1 Archive Media / F2 Place Wiki / F3 Journal / F4 Share Presentation / F5 Finance Deep-Dive
-- 五大高收益功能数据迁移：离线纪念册 / 旅行知识库 / 智能日记 / 公开分享 v3 / 财务深耕

-- F5: finance accounts
CREATE TABLE `finance_accounts` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `kind` ENUM('cash', 'debit', 'credit', 'prepaid') NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'CNY',
  `is_archived` BOOLEAN NOT NULL DEFAULT false,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `idx_finance_accounts_account_id` (`account_id`),
  INDEX `idx_finance_accounts_account_archived` (`account_id`, `is_archived`),
  UNIQUE INDEX `uq_finance_accounts_account_name_active` (`account_id`, `name`, `is_archived`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- F5: fx rate snapshots (point-in-time)
CREATE TABLE `fx_rate_snapshots` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `base_currency` VARCHAR(191) NOT NULL,
  `quote_currency` VARCHAR(191) NOT NULL,
  `rate` DECIMAL(18, 8) NOT NULL,
  `source` VARCHAR(191) NOT NULL,
  `taken_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_fx_rate_snapshots_lookup` (`account_id`, `base_currency`, `quote_currency`, `taken_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- F5: trip_expenses augmentation
ALTER TABLE `trip_expenses`
  ADD COLUMN `finance_account_id` VARCHAR(191) NULL,
  ADD COLUMN `fx_snapshot_id` VARCHAR(191) NULL,
  ADD COLUMN `reimbursement_status` ENUM('pending', 'submitted', 'reimbursed', 'n_a') NOT NULL DEFAULT 'n_a',
  ADD INDEX `idx_trip_expenses_finance_account_id` (`finance_account_id`),
  ADD INDEX `idx_trip_expenses_reimbursement_status` (`reimbursement_status`);

-- F2: places knowledge base
CREATE TABLE `places` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `kind` ENUM('hotel', 'restaurant', 'sight', 'cafe', 'onsen', 'shop', 'other') NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `city` VARCHAR(191) NULL,
  `region` VARCHAR(191) NULL,
  `country_code` VARCHAR(191) NULL,
  `latitude` DECIMAL(10, 7) NULL,
  `longitude` DECIMAL(10, 7) NULL,
  `tags_json` JSON NOT NULL,
  `private_rating` INTEGER NULL,
  `my_notes_md` TEXT NULL,
  `is_favorite` BOOLEAN NOT NULL DEFAULT false,
  `visit_count` INTEGER NOT NULL DEFAULT 0,
  `first_visited_at` DATETIME(3) NULL,
  `last_visited_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `idx_places_account_id` (`account_id`),
  INDEX `idx_places_account_kind` (`account_id`, `kind`),
  INDEX `idx_places_lat_lng` (`latitude`, `longitude`),
  INDEX `idx_places_account_favorite` (`account_id`, `is_favorite`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- F2: visit_markers.place_id
ALTER TABLE `visit_markers`
  ADD COLUMN `place_id` VARCHAR(191) NULL,
  ADD INDEX `idx_visit_markers_place_id` (`place_id`);

-- F3: journal entries
CREATE TABLE `journal_entries` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `trip_id` VARCHAR(191) NOT NULL,
  `entry_date` DATE NOT NULL,
  `mood` ENUM('delighted', 'calm', 'tired', 'excited', 'reflective', 'neutral') NOT NULL DEFAULT 'neutral',
  `weather` VARCHAR(191) NULL,
  `body_md` TEXT NOT NULL,
  `ai_draft_md` TEXT NULL,
  `ai_model` VARCHAR(191) NULL,
  `ai_generated_at` DATETIME(3) NULL,
  `is_pinned` BOOLEAN NOT NULL DEFAULT false,
  `edited_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `idx_journal_entries_account_id` (`account_id`),
  INDEX `idx_journal_entries_trip_date` (`trip_id`, `entry_date`),
  UNIQUE INDEX `uq_journal_entries_trip_date` (`trip_id`, `entry_date`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- F1: archive media cache
CREATE TABLE `archive_media_cache` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `source_url` TEXT NOT NULL,
  `sha256` VARCHAR(191) NOT NULL,
  `byte_size` INTEGER NOT NULL,
  `mime_type` VARCHAR(191) NULL,
  `local_path` TEXT NOT NULL,
  `fetched_at` DATETIME(3) NOT NULL,
  `last_used_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `uq_archive_media_cache_account_sha` (`account_id`, `sha256`),
  INDEX `idx_archive_media_cache_account_id` (`account_id`),
  INDEX `idx_archive_media_cache_last_used_at` (`last_used_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- F4: share link presentation (template + slug + OG fields)
CREATE TABLE `share_link_presentations` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `share_link_id` VARCHAR(191) NOT NULL,
  `template` ENUM('magazine', 'postcard', 'minimal', 'polaroid') NOT NULL DEFAULT 'magazine',
  `slug` VARCHAR(191) NOT NULL,
  `og_title` VARCHAR(191) NULL,
  `og_subtitle` TEXT NULL,
  `og_cover_url` TEXT NULL,
  `theme_color` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `share_link_presentations_share_link_id_key` (`share_link_id`),
  UNIQUE INDEX `share_link_presentations_slug_key` (`slug`),
  INDEX `idx_share_link_presentations_account_id` (`account_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
