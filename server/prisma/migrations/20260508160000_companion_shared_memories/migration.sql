-- CreateTable
CREATE TABLE `companion_memory_snapshots` (
  `id` VARCHAR(191) NOT NULL,
  `account_id` VARCHAR(191) NOT NULL,
  `companion_id` VARCHAR(191) NOT NULL,
  `snapshot_version` INTEGER NOT NULL DEFAULT 1,
  `payload_json` JSON NOT NULL,
  `source_marker_count` INTEGER NOT NULL DEFAULT 0,
  `source_photo_count` INTEGER NOT NULL DEFAULT 0,
  `source_guide_count` INTEGER NOT NULL DEFAULT 0,
  `generated_at` DATETIME(3) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `uq_companion_memory_snapshots_account_companion`(`account_id`, `companion_id`),
  INDEX `idx_companion_memory_snapshots_expires_at`(`expires_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `companion_memory_snapshots`
  ADD CONSTRAINT `companion_memory_snapshots_account_id_fkey`
  FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `companion_memory_snapshots`
  ADD CONSTRAINT `companion_memory_snapshots_companion_id_fkey`
  FOREIGN KEY (`companion_id`) REFERENCES `travel_companions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
