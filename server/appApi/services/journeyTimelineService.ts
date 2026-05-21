import { getPrismaClient } from '../prisma.js';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import type { JourneyBucketDto, JourneyTimelineResponseDto } from '../types.js';

function getQuarter(date: Date) {
  return Math.floor(date.getUTCMonth() / 3) + 1;
}

function bucketKey(date: Date, mode: 'quarter' | 'half') {
  const year = date.getUTCFullYear();
  if (mode === 'half') return `${year}-H${date.getUTCMonth() < 6 ? 1 : 2}`;
  return `${year}-Q${getQuarter(date)}`;
}

export async function getJourneyTimeline(account: AuthenticatedAccount, mode: 'quarter' | 'half' = 'quarter'): Promise<JourneyTimelineResponseDto> {
  const prisma = getPrismaClient();
  const markers = await prisma.visitMarker.findMany({
    where: { accountId: account.id, isDeleted: false },
    include: { images: true, trip: true, savedGuides: true },
    orderBy: [{ visitedStartAt: 'asc' }],
  });
  const buckets = new Map<string, JourneyBucketDto>();
  for (const marker of markers) {
    const key = bucketKey(marker.visitedStartAt, mode);
    const bucket = buckets.get(key) ?? {
      id: key,
      title: `${key} 旅行故事`,
      periodLabel: key,
      markerCount: 0,
      tripCount: 0,
      photoCount: 0,
      highlights: [],
      routeSegments: [],
    };
    bucket.markerCount += 1;
    bucket.photoCount += marker.images.length;
    if (marker.trip && !bucket.highlights.some((item) => item.id === `trip:${marker.trip!.id}`)) {
      bucket.tripCount += 1;
      bucket.highlights.push({ id: `trip:${marker.trip.id}`, kind: 'trip', title: marker.trip.name, description: marker.trip.note, path: `/trips/${marker.trip.id}` });
    }
    if (marker.images[0]) {
      bucket.highlights.push({ id: `photo:${marker.images[0].id}`, kind: 'photo', title: `${marker.scopeName} · ${marker.city}`, description: marker.images[0].caption ?? '精选旅行瞬间' });
    }
    buckets.set(key, bucket);
  }
  return { buckets: Array.from(buckets.values()).reverse(), generatedAt: new Date().toISOString() };
}
