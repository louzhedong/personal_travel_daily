-- Persist first unlock moments for global and annual travel achievements.
CREATE TABLE `achievement_unlocks` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `achievement_id` VARCHAR(191) NOT NULL,
  `period_key` VARCHAR(191) NOT NULL,
  `unlocked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `evidence_json` JSON NULL,

  PRIMARY KEY (`id`),
  INDEX `idx_achievement_unlocks_account_id`(`account_id`),
  INDEX `idx_achievement_unlocks_achievement_id`(`achievement_id`),
  UNIQUE INDEX `uq_achievement_unlocks_account_achievement_period`(`account_id`, `achievement_id`, `period_key`),
  CONSTRAINT `achievement_unlocks_account_id_fkey`
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
