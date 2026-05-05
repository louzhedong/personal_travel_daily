import { createNotFoundError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import { findTripDetailSource } from '../repositories/tripDetailRepository.js';
import { listActiveTripChecklistItemsByTripId } from '../repositories/tripChecklistRepository.js';
import { listActiveTripPlanningItemsByTripId } from '../repositories/tripPlanningRepository.js';
import {
  serializeTripDetail,
  serializeTripDetailGuide,
  serializeTripDetailMarker,
  type TripDetailModel,
} from '../serializers/tripDetailSerializer.js';
import { buildTripChecklistGroups, buildTripChecklistSummary } from '../serializers/tripChecklistSerializer.js';
import { buildTripPlanningSummary } from '../serializers/tripPlanningSerializer.js';

type TripDetailSource = NonNullable<Awaited<ReturnType<typeof findTripDetailSource>>>;
type TripDetailMarkerSource = TripDetailSource['markers'][number];

function enumerateDateKeys(startAt: Date, endAt: Date) {
  const start = new Date(Date.UTC(startAt.getUTCFullYear(), startAt.getUTCMonth(), startAt.getUTCDate()));
  const end = new Date(Date.UTC(endAt.getUTCFullYear(), endAt.getUTCMonth(), endAt.getUTCDate()));
  const keys: string[] = [];

  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    keys.push(cursor.toISOString().slice(0, 10));
  }

  return keys;
}

function countTravelDays(markers: TripDetailMarkerSource[]) {
  const uniqueDays = new Set<string>();
  markers.forEach((marker) => {
    enumerateDateKeys(marker.visitedStartAt, marker.visitedEndAt).forEach((day) => uniqueDays.add(day));
  });
  return uniqueDays.size;
}

function buildSummary(markers: TripDetailMarkerSource[], guideCount: number, photoCount: number) {
  return {
    markerCount: markers.length,
    travelDays: countTravelDays(markers),
    cityCount: new Set(markers.map((marker) => `${marker.scope}:${marker.scopeId}:${marker.city}`)).size,
    regionCount: new Set(markers.map((marker) => `${marker.scope}:${marker.scopeId}`)).size,
    companionCount: new Set(markers.map((marker) => marker.companionId)).size,
    guideCount,
    photoCount,
  };
}

function buildCompanionSummary(markers: TripDetailMarkerSource[]): TripDetailModel['companions'] {
  const companionMap = new Map<
    string,
    {
      id: string;
      name: string;
      color: string;
      markerCount: number;
    }
  >();

  markers.forEach((marker) => {
    const current = companionMap.get(marker.companionId) ?? {
      id: marker.companion.id,
      name: marker.companion.name,
      color: marker.companion.color,
      markerCount: 0,
    };
    current.markerCount += 1;
    companionMap.set(marker.companionId, current);
  });

  return Array.from(companionMap.values()).sort((left, right) => {
    if (right.markerCount !== left.markerCount) {
      return right.markerCount - left.markerCount;
    }
    return left.name.localeCompare(right.name);
  });
}

function buildPhotos(markers: TripDetailMarkerSource[]): TripDetailModel['photos'] {
  return markers
    .flatMap((marker) =>
      marker.images.map((image) => ({
        imageId: image.id,
        markerId: marker.id,
        markerTitle: `${marker.scopeName} · ${marker.city}`,
        imageUrl: image.imageUrl,
        visitedStartAt: marker.visitedStartAt,
        scopeName: marker.scopeName,
        city: marker.city,
        isFeatured: image.isFeatured,
        caption: image.caption ?? undefined,
        curatedSortOrder: image.curatedSortOrder ?? undefined,
        originalSortOrder: image.sortOrder,
      })),
    )
    .sort((left, right) => {
      if (left.isFeatured !== right.isFeatured) {
        return left.isFeatured ? -1 : 1;
      }
      const leftCurated = left.curatedSortOrder ?? Number.MAX_SAFE_INTEGER;
      const rightCurated = right.curatedSortOrder ?? Number.MAX_SAFE_INTEGER;
      if (leftCurated !== rightCurated) {
        return leftCurated - rightCurated;
      }
      const dateCompare = left.visitedStartAt.getTime() - right.visitedStartAt.getTime();
      if (dateCompare !== 0) {
        return dateCompare;
      }
      return left.originalSortOrder - right.originalSortOrder;
    })
    .map(({ originalSortOrder, ...photo }) => photo);
}

function buildGuides(markers: TripDetailMarkerSource[]): TripDetailModel['guides'] {
  const guideMap = new Map<string, ReturnType<typeof serializeTripDetailGuide>>();

  markers.forEach((marker) => {
    marker.savedGuides.forEach((savedGuide) => {
      const dedupeKey = `${savedGuide.guideIdentity}:${savedGuide.saveContextKey}`;
      const serialized = serializeTripDetailGuide(savedGuide);
      const current = guideMap.get(dedupeKey);

      if (!current || serialized.savedAt.getTime() > current.savedAt.getTime()) {
        guideMap.set(dedupeKey, serialized);
      }
    });
  });

  return Array.from(guideMap.values()).sort((left, right) => right.savedAt.getTime() - left.savedAt.getTime());
}

export async function getTripDetail(accountId: string, tripId: string) {
  const prisma = getPrismaClient();
  const source = await findTripDetailSource(prisma, accountId, tripId);

  if (!source) {
    throw createNotFoundError('trip not found');
  }

  const [checklistItems, planningItems] = await Promise.all([
    listActiveTripChecklistItemsByTripId(prisma, accountId, tripId),
    listActiveTripPlanningItemsByTripId(prisma, accountId, tripId),
  ]);
  const guides = buildGuides(source.markers);
  const photos = buildPhotos(source.markers);
  const model: TripDetailModel = {
    trip: source,
    summary: buildSummary(source.markers, guides.length, photos.length),
    companions: buildCompanionSummary(source.markers),
    markers: source.markers.map(serializeTripDetailMarker),
    photos,
    guides,
    planningSummary: buildTripPlanningSummary(planningItems),
    checklistSummary: buildTripChecklistSummary(checklistItems),
    checklistGroups: buildTripChecklistGroups(checklistItems),
    meta: {
      generatedAt: new Date(),
    },
  };

  return serializeTripDetail(model);
}
