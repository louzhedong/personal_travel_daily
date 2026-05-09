CREATE TABLE `admin_audit_logs` (
  `id` VARCHAR(191) NOT NULL,
  `admin_account_id` VARCHAR(191) NOT NULL,
  `action` VARCHAR(191) NOT NULL,
  `target_kind` VARCHAR(191) NULL,
  `target_id` VARCHAR(191) NULL,
  `metadata_json` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `idx_admin_audit_logs_admin_account_id`(`admin_account_id`),
  INDEX `idx_admin_audit_logs_action`(`action`),
  INDEX `idx_admin_audit_logs_target`(`target_kind`, `target_id`),
  INDEX `idx_admin_audit_logs_created_at`(`created_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `admin_audit_logs`
  ADD CONSTRAINT `admin_audit_logs_admin_account_id_fkey`
  FOREIGN KEY (`admin_account_id`) REFERENCES `accounts`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
