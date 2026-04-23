import type {
  Account,
  GuideSearchHistory,
  SavedGuide,
  TravelCompanion,
  VisitMarker,
  VisitMarkerImage,
} from '@prisma/client';
import type {
  AdminAccountNodeDto,
  AdminCompanionNodeDto,
  AdminGuideSearchHistoryNodeDto,
  AdminMarkerNodeDto,
  AdminOverviewResponseDto,
  AdminSavedGuideNodeDto,
  GuideContentBlockDto,
  GuideDocumentDto,
  GuideSearchResultDto,
} from '../types.js';

type CompanionWithRelations = TravelCompanion & {
  markers: Array<VisitMarker & { images: VisitMarkerImage[] }>;
  guides: SavedGuide[];
  histories: GuideSearchHistory[];
};

type AccountWithRelations = Account & {
  companions: CompanionWithRelations[];
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

function serializeMarker(marker: VisitMarker & { images: VisitMarkerImage[] }): AdminMarkerNodeDto {
  const imageUrls = marker.images.map((image) => image.imageUrl).filter(Boolean);

  return {
    id: marker.id,
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

function serializeCompanion(companion: CompanionWithRelations): AdminCompanionNodeDto {
  return {
    id: companion.id,
    name: companion.name,
    color: companion.color,
    createdAt: toIsoString(companion.createdAt),
    markers: companion.markers.map(serializeMarker),
    savedGuides: companion.guides.map(serializeSavedGuide),
    guideSearchHistory: companion.histories.map(serializeGuideSearchHistory),
  };
}

function serializeAccount(account: AccountWithRelations): AdminAccountNodeDto {
  const companions = account.companions.map(serializeCompanion);
  const stats = companions.reduce(
    (summary, companion) => ({
      companionCount: summary.companionCount + 1,
      markerCount: summary.markerCount + companion.markers.length,
      savedGuideCount: summary.savedGuideCount + companion.savedGuides.length,
      guideSearchHistoryCount: summary.guideSearchHistoryCount + companion.guideSearchHistory.length,
    }),
    {
      companionCount: 0,
      markerCount: 0,
      savedGuideCount: 0,
      guideSearchHistoryCount: 0,
    },
  );

  return {
    id: account.id,
    name: account.name,
    username: account.username,
    role: account.role,
    createdAt: toIsoString(account.createdAt),
    companions,
    stats,
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
