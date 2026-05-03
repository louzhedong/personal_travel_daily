import type {
  Account,
  GuideSearchHistory,
  MarkerSearchEvent,
  SavedGuide,
  TravelCompanion,
  Trip,
  TripPlanningItem,
  VisitMarker,
  VisitMarkerImage,
} from '@prisma/client';
import type {
  AdminAccountNodeDto,
  AdminCompanionNodeDto,
  AdminGuideSearchHistoryNodeDto,
  AdminMarkerSearchEventNodeDto,
  AdminMarkerNodeDto,
  AdminOverviewResponseDto,
  AdminPlanningItemNodeDto,
  AdminSavedGuideNodeDto,
  AdminTripNodeDto,
  GuideContentBlockDto,
  GuideDocumentDto,
  GuideSearchResultDto,
} from '../types.js';
import { buildAdminAccountStats } from '../services/admin/accountStats.js';
import { serializeTripPlanningItem } from './tripPlanningSerializer.js';

// admin serializer：model → DTO 映射。
// admin serializer: model → DTO mapping.
// 派生聚合（账号级 stats 计数）已下沉到 services/adminService.ts 的 buildAdminAccountStats，
// 本文件只保留序列化职责。
// Derived aggregations (per-account stats counts) live in services/adminService.ts#buildAdminAccountStats,
// keeping this file focused on serialization.

type CompanionWithRelations = TravelCompanion & {
  markers: Array<VisitMarker & { images: VisitMarkerImage[] }>;
  guides: SavedGuide[];
  histories: GuideSearchHistory[];
  tripPlanningItems: Array<TripPlanningItem & { trip: Trip }>;
};

type AccountWithRelations = Account & {
  trips: Trip[];
  companions: CompanionWithRelations[];
  markerSearchEvents: MarkerSearchEvent[];
};

function toIsoString(value: Date): string {
  return value.toISOString();
}

function toDateOnlyString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function isGuideContentBlockArray(value: unknown): value is GuideContentBlockDto[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        !!item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.type === 'string' &&
        typeof item.text === 'string',
    )
  );
}

function isGuideDocumentPayload(payload: unknown): payload is GuideDocumentDto {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Partial<GuideDocumentDto>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.summary === 'string' &&
    typeof candidate.sourceName === 'string' &&
    typeof candidate.sourceUrl === 'string' &&
    typeof candidate.fetchedAt === 'string' &&
    isGuideContentBlockArray(candidate.blocks)
  );
}

function isGuideSearchResultPayload(payload: unknown): payload is GuideSearchResultDto {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Partial<GuideSearchResultDto>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.summary === 'string' &&
    typeof candidate.sourceName === 'string' &&
    typeof candidate.sourceUrl === 'string'
  );
}

function buildGuideResultFallback(savedGuide: SavedGuide): GuideSearchResultDto {
  return {
    id: savedGuide.id,
    title: savedGuide.guideTitle,
    summary: savedGuide.guideSummary,
    coverImageUrl: savedGuide.guideCoverImageUrl ?? undefined,
    sourceName: savedGuide.guideSourceName,
    sourceUrl: savedGuide.guideSourceUrl,
    authorName: savedGuide.guideAuthorName ?? undefined,
    publishedAt: savedGuide.guidePublishedAt ? toIsoString(savedGuide.guidePublishedAt) : undefined,
    destinationLabel: savedGuide.guideDestinationLabel ?? undefined,
  };
}

function serializeTrip(trip: Trip): AdminTripNodeDto {
  return {
    id: trip.id,
    name: trip.name,
    coverImageUrl: trip.coverImageUrl ?? undefined,
    note: trip.note,
    startsAt: toDateOnlyString(trip.startsAt),
    endsAt: toDateOnlyString(trip.endsAt),
    createdAt: toIsoString(trip.createdAt),
  };
}

function serializeMarker(marker: VisitMarker & { images: VisitMarkerImage[] }): AdminMarkerNodeDto {
  const imageUrls = marker.images.map((image) => image.imageUrl).filter(Boolean);

  return {
    id: marker.id,
    tripId: marker.tripId ?? undefined,
    scope: marker.scope,
    scopeId: marker.scopeId,
    scopeName: marker.scopeName,
    city: marker.city,
    note: marker.note,
    imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    visitedStartAt: toDateOnlyString(marker.visitedStartAt),
    visitedEndAt: toDateOnlyString(marker.visitedEndAt),
    createdAt: toIsoString(marker.createdAt),
  };
}

function serializeSavedGuide(savedGuide: SavedGuide): AdminSavedGuideNodeDto {
  const payload = savedGuide.guidePayloadJson;
  const result =
    isGuideDocumentPayload(payload) || isGuideSearchResultPayload(payload)
      ? payload
      : buildGuideResultFallback(savedGuide);

  return {
    id: savedGuide.id,
    markerId: savedGuide.markerId ?? undefined,
    keyword: savedGuide.keyword,
    result,
    savedAt: toIsoString(savedGuide.savedAt),
  };
}

function serializeGuideSearchHistory(history: GuideSearchHistory): AdminGuideSearchHistoryNodeDto {
  return {
    id: history.id,
    keyword: history.keyword,
    scope: history.scope,
    createdAt: toIsoString(history.createdAt),
  };
}

function serializeMarkerSearchEvent(event: MarkerSearchEvent): AdminMarkerSearchEventNodeDto {
  return {
    id: event.id,
    companionId: event.companionId ?? undefined,
    keyword: event.keyword,
    scope: event.scope,
    year: event.year ?? undefined,
    resultCount: event.resultCount,
    page: event.page,
    pageSize: event.pageSize,
    createdAt: toIsoString(event.createdAt),
  };
}

function serializePlanningItem(
  item: TripPlanningItem & { trip: Trip; createdByCompanion: TravelCompanion },
): AdminPlanningItemNodeDto {
  return {
    ...serializeTripPlanningItem(item),
    tripName: item.trip.name,
  };
}

function serializeCompanion(companion: CompanionWithRelations): AdminCompanionNodeDto {
  return {
    id: companion.id,
    name: companion.name,
    color: companion.color,
    createdAt: toIsoString(companion.createdAt),
    markers: companion.markers.map(serializeMarker),
    savedGuides: companion.guides.map(serializeSavedGuide),
    guideSearchHistory: companion.histories.map(serializeGuideSearchHistory),
    planningItems: companion.tripPlanningItems.map((item) =>
      serializePlanningItem({ ...item, createdByCompanion: companion }),
    ),
  };
}

function serializeAccount(account: AccountWithRelations): AdminAccountNodeDto {
  const trips = account.trips.map(serializeTrip);
  const companions = account.companions.map(serializeCompanion);
  const markerSearchEvents = account.markerSearchEvents.map(serializeMarkerSearchEvent);

  return {
    id: account.id,
    name: account.name,
    username: account.username,
    role: account.role,
    createdAt: toIsoString(account.createdAt),
    trips,
    companions,
    markerSearchEvents,
    stats: buildAdminAccountStats({
      tripCount: trips.length,
      companions,
      markerSearchEventCount: markerSearchEvents.length,
    }),
  };
}

export function serializeAdminOverview(accounts: AccountWithRelations[]): AdminOverviewResponseDto {
  return {
    accounts: accounts.map(serializeAccount),
    meta: {
      fetchedAt: toIsoString(new Date()),
      accountCount: accounts.length,
    },
  };
}
