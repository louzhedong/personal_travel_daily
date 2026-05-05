ALTER TABLE `trip_planning_items`
  ADD COLUMN `source_wishlist_id` VARCHAR(191) NULL;

CREATE INDEX `idx_trip_planning_items_source_wishlist_id`
  ON `trip_planning_items` (`source_wishlist_id`);

ALTER TABLE `trip_planning_items`
  ADD CONSTRAINT `trip_planning_items_source_wishlist_id_fkey`
  FOREIGN KEY (`source_wishlist_id`) REFERENCES `wishlist_items`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
