import type { JourneyBucketDto } from '../../lib/api/types';

export function getJourneyBucketSummary(bucket: JourneyBucketDto) {
  return `${bucket.tripCount} 段行程 · ${bucket.markerCount} 条记录 · ${bucket.photoCount} 张照片`;
}
