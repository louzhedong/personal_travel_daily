ALTER TABLE `accounts`
  ADD COLUMN `role` ENUM('admin', 'member') NOT NULL DEFAULT 'member' AFTER `username`;

UPDATE `accounts`
SET `role` = 'admin'
WHERE `id` = 'acct_default';
