ALTER TABLE `visit_marker_images`
  ADD COLUMN `is_featured` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `caption` VARCHAR(191) NULL,
  ADD COLUMN `curated_sort_order` INTEGER NULL;

CREATE INDEX `idx_visit_marker_images_is_featured` ON `visit_marker_images`(`is_featured`);
CREATE INDEX `idx_visit_marker_images_curated_sort_order` ON `visit_marker_images`(`curated_sort_order`);
