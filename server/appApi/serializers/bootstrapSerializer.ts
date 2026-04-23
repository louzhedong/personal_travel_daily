import type {
  GuideSearchHistory,
  SavedGuide,
  TravelCompanion,
  Trip,
  VisitMarker,
  VisitMarkerImage,
} from '@prisma/client';
import type {
  BootstrapResponseDto,
  CurrentAccountDto,
  DeleteSavedGuideResponseDto,
  GuideContentBlockDto,
  GuideSearchHistoryListResponseDto,
  GuideDocumentDto,
  GuideSearchHistoryMutationResponseDto,
  GuideSearchHistoryItemDto,
  GuideSearchResultDto,
  SavedGuideListResponseDto,
  SavedGuideMutationResponseDto,
  SavedGuideDto,
  TravelStoreDto,
  TripDto,
  UserProfileDto,
  VisitMarkerDto,
} from '../types.js';

type MarkerWithImages = VisitMarker & {
  images: VisitMarkerImage[];
};

function toIsoString(value: Date): string {
  return value.toISOString();
}

function toDateOnlyString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function serializeCompanion(companion: TravelCompanion): UserProfileDto {
  return {
    id: companion.id,
    name: companion.name,
    color: companion.color,
  };
}

function serializeTrip(trip: Trip): TripDto {
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

function serializeMarker(marker: MarkerWithImages): VisitMarkerDto {
  const imageUrls = marker.images.map((image) => image.imageUrl).filter(Boolean);

  return {
    id: marker.id,
    userId: marker.companionId,
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

export function serializeSavedGuide(savedGuide: SavedGuide): SavedGuideDto {
  return serializeSavedGuideItem(savedGuide);
}

function serializeSavedGuideItem(savedGuide: SavedGuide): SavedGuideDto {
  const payload = savedGuide.guidePayloadJson;
  const result =
    isGuideDocumentPayload(payload) || isGuideSearchResultPayload(payload)
      ? payload
      : buildGuideResultFallback(savedGuide);

  return {
    id: savedGuide.id,
    markerId: savedGuide.markerId ?? undefined,
    savedByUserId: savedGuide.savedByCompanionId,
    keyword: savedGuide.keyword,
    result,
    savedAt: toIsoString(savedGuide.savedAt),
  };
}

export function serializeGuideSearchHistory(history: GuideSearchHistory): GuideSearchHistoryItemDto {
  return {
    id: history.id,
    keyword: history.keyword,
    scope: history.scope,
    createdAt: toIsoString(history.createdAt),
  };
}

export function serializeSavedGuidesList(savedGuides: SavedGuide[]): SavedGuideListResponseDto {
  return {
    items: savedGuides.map(serializeSavedGuideItem),
  };
}

export function serializeSavedGuideMutation(
  savedGuide: SavedGuide,
  deduplicated = false,
): SavedGuideMutationResponseDto {
  return {
    item: serializeSavedGuideItem(savedGuide),
    ...(deduplicated ? { deduplicated: true } : {}),
  };
}

export function serializeDeleteSavedGuide(savedGuideId: string): DeleteSavedGuideResponseDto {
  return {
    deletedId: savedGuideId,
  };
}

export function serializeGuideSearchHistoryList(
  histories: GuideSearchHistory[],
): GuideSearchHistoryListResponseDto {
  return {
    items: histories.map(serializeGuideSearchHistory),
  };
}

export function serializeGuideSearchHistoryMutation(
  history: GuideSearchHistory,
  deduplicated = false,
): GuideSearchHistoryMutationResponseDto {
  return {
    item: serializeGuideSearchHistory(history),
    ...(deduplicated ? { deduplicated: true } : {}),
  };
}

export function serializeBootstrapStore(input: {
  users: TravelCompanion[];
  trips: Trip[];
  markers: MarkerWithImages[];
  activeUserId: string;
  savedGuides: SavedGuide[];
  guideSearchHistory: GuideSearchHistory[];
}): TravelStoreDto {
  return {
    users: input.users.map(serializeCompanion),
    trips: input.trips.map(serializeTrip),
    markers: input.markers.map(serializeMarker),
    activeUserId: input.activeUserId,
    savedGuides: input.savedGuides.map(serializeSavedGuideItem),
    guideSearchHistory: input.guideSearchHistory.map(serializeGuideSearchHistory),
  };
}

export function serializeBootstrapResponse(input: {
  account: CurrentAccountDto;
  fetchedAt: Date;
  store: TravelStoreDto;
}): BootstrapResponseDto {
  return {
    store: input.store,
    meta: {
      accountId: input.account.id,
      account: input.account,
      fetchedAt: toIsoString(input.fetchedAt),
    },
  };
}
