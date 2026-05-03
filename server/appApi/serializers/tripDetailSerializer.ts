import type {
  SavedGuide,
  Trip,
  TravelCompanion,
  TripChecklistItem,
  VisitMarker,
  VisitMarkerImage,
} from '@prisma/client';
import type {
  GuideContentBlockDto,
  GuideDocumentDto,
  GuideSearchResultDto,
  TripChecklistGroupDto,
  TripChecklistItemDto,
  TripDetailResponseDto,
} from '../types.js';
import {
  normalizeMarkerBudgetLevel,
  normalizeMarkerMood,
  normalizeMarkerTags,
  normalizeMarkerTransport,
  normalizeMarkerWeather,
} from './bootstrap/markers.js';

export interface TripDetailModel {
  trip: Trip;
  summary: TripDetailResponseDto['summary'];
  companions: TripDetailResponseDto['companions'];
  markers: Array<
    Omit<TripDetailResponseDto['markers'][number], 'visitedStartAt' | 'visitedEndAt'> & {
      visitedStartAt: Date;
      visitedEndAt: Date;
    }
  >;
  photos: Array<
    Omit<TripDetailResponseDto['photos'][number], 'visitedStartAt'> & {
      visitedStartAt: Date;
    }
  >;
  guides: Array<
    Omit<TripDetailResponseDto['guides'][number], 'savedAt'> & {
      savedAt: Date;
    }
  >;
  planningSummary: TripDetailResponseDto['planningSummary'];
  checklistSummary: TripDetailResponseDto['checklistSummary'];
  checklistGroups: TripDetailResponseDto['checklistGroups'];
  meta: {
    generatedAt: Date;
  };
}

function toIsoString(value: Date) {
  return value.toISOString();
}

function toDateOnlyString(value: Date) {
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
    id: savedGuide.guideIdentity,
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

export function serializeTripDetailGuide(savedGuide: SavedGuide) {
  const payload = savedGuide.guidePayloadJson;
  const result =
    isGuideDocumentPayload(payload) || isGuideSearchResultPayload(payload)
      ? payload
      : buildGuideResultFallback(savedGuide);

  return {
    id: savedGuide.id,
    markerId: savedGuide.markerId ?? undefined,
    keyword: savedGuide.keyword,
    savedAt: savedGuide.savedAt,
    result,
  };
}

export function serializeTripChecklistItem(
  item: TripChecklistItem & {
    createdByCompanion: TravelCompanion;
  },
): TripChecklistItemDto {
  return {
    id: item.id,
    companionId: item.createdByCompanionId,
    companionName: item.createdByCompanion.name,
    companionColor: item.createdByCompanion.color,
    title: item.title,
    note: item.note ?? undefined,
    stage: item.stage,
    sortOrder: item.sortOrder,
    origin: item.origin === 'manual' ? 'manual' : 'generated',
    sourceGuideIdentity: item.sourceGuideIdentity ?? undefined,
    sourceGuideTitle: item.sourceGuideTitle ?? undefined,
    sourceGuideSourceName: item.sourceGuideSourceName ?? undefined,
    sourceGuideSourceUrl: item.sourceGuideSourceUrl ?? undefined,
    sourceSnippet: item.sourceSnippet ?? undefined,
    createdAt: toIsoString(item.createdAt),
    updatedAt: toIsoString(item.updatedAt),
  };
}

export function buildTripChecklistGroupMeta(stage: TripChecklistGroupDto['stage']) {
  switch (stage) {
    case 'pre_departure':
      return { title: '出发前准备', description: '把预约、路线、装备和行前确认放在这里。' };
    case 'in_transit':
      return { title: '旅途中留意', description: '把路上节奏、交通衔接和现场提醒收在这里。' };
    case 'done':
      return { title: '已经完成', description: '完成的事项会沉淀到这一组，方便回看。' };
  }
}

export function buildTripDetailMarkerImageUrls(marker: VisitMarker & { images: VisitMarkerImage[] }) {
  const imageUrls = marker.images.map((image) => image.imageUrl).filter(Boolean);
  return imageUrls.length > 0 ? imageUrls : undefined;
}

export function serializeTripDetailMarker(
  marker: VisitMarker & { companion: TravelCompanion; images: VisitMarkerImage[] },
) {
  return {
    id: marker.id,
    companionId: marker.companionId,
    companionName: marker.companion.name,
    companionColor: marker.companion.color,
    scope: marker.scope,
    scopeId: marker.scopeId,
    scopeName: marker.scopeName,
    city: marker.city,
    note: marker.note,
    tags: normalizeMarkerTags(marker.tags),
    mood: normalizeMarkerMood(marker.mood),
    weather: normalizeMarkerWeather(marker.weather),
    transport: normalizeMarkerTransport(marker.transport),
    budgetLevel: normalizeMarkerBudgetLevel(marker.budgetLevel),
    imageUrls: buildTripDetailMarkerImageUrls(marker),
    visitedStartAt: marker.visitedStartAt,
    visitedEndAt: marker.visitedEndAt,
  };
}

export function serializeTripDetail(model: TripDetailModel): TripDetailResponseDto {
  return {
    trip: {
      id: model.trip.id,
      name: model.trip.name,
      coverImageUrl: model.trip.coverImageUrl ?? undefined,
      note: model.trip.note,
      startsAt: toDateOnlyString(model.trip.startsAt),
      endsAt: toDateOnlyString(model.trip.endsAt),
      createdAt: toIsoString(model.trip.createdAt),
    },
    summary: model.summary,
    companions: model.companions,
    markers: model.markers.map((marker) => ({
      ...marker,
      visitedStartAt: toDateOnlyString(marker.visitedStartAt),
      visitedEndAt: toDateOnlyString(marker.visitedEndAt),
    })),
    photos: model.photos.map((photo) => ({
      ...photo,
      visitedStartAt: toDateOnlyString(photo.visitedStartAt),
    })),
    guides: model.guides.map((guide) => ({
      ...guide,
      savedAt: toIsoString(guide.savedAt),
    })),
    planningSummary: model.planningSummary,
    checklistSummary: model.checklistSummary,
    checklistGroups: model.checklistGroups,
    meta: {
      generatedAt: toIsoString(model.meta.generatedAt),
    },
  };
}
