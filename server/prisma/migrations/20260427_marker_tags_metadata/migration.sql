-- Add lightweight metadata fields for marker tags, mood, weather, transport, and budget level.
SET @stmt = IF(
  EXISTS(
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'visit_markers'
      AND COLUMN_NAME = 'tags'
  ),
  'SELECT 1',
  'ALTER TABLE `visit_markers` ADD COLUMN `tags` JSON NULL'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  EXISTS(
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'visit_markers'
      AND COLUMN_NAME = 'mood'
  ),
  'SELECT 1',
  'ALTER TABLE `visit_markers` ADD COLUMN `mood` VARCHAR(191) NULL'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  EXISTS(
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'visit_markers'
      AND COLUMN_NAME = 'weather'
  ),
  'SELECT 1',
  'ALTER TABLE `visit_markers` ADD COLUMN `weather` VARCHAR(191) NULL'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  EXISTS(
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'visit_markers'
      AND COLUMN_NAME = 'transport'
  ),
  'SELECT 1',
  'ALTER TABLE `visit_markers` ADD COLUMN `transport` VARCHAR(191) NULL'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  EXISTS(
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'visit_markers'
      AND COLUMN_NAME = 'budget_level'
  ),
  'SELECT 1',
  'ALTER TABLE `visit_markers` ADD COLUMN `budget_level` VARCHAR(191) NULL'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
