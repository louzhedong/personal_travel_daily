import type { CompanionMemoryResponseDto } from '../types.js';

export const COMPANION_MEMORY_SNAPSHOT_VERSION = 1;

export interface CompanionMemoryModel {
  companion: CompanionMemoryResponseDto['companion'];
  summary: Omit<CompanionMemoryResponseDto['summary'], 'firstSharedAt' | 'latestSharedAt'> & {
    firstSharedAt?: Date;
    latestSharedAt?: Date;
  };
  yearlySeries: CompanionMemoryResponseDto['yearlySeries'];
  topRegions: CompanionMemoryResponseDto['topRegions'];
  topCities: CompanionMemoryResponseDto['topCities'];
  themes: CompanionMemoryResponseDto['themes'];
  trips: Array<Omit<CompanionMemoryResponseDto['trips'][number], 'startsAt' | 'endsAt'> & {
    startsAt: Date;
    endsAt: Date;
  }>;
  photos: Array<Omit<CompanionMemoryResponseDto['photos'][number], 'visitedStartAt'> & {
    visitedStartAt: Date;
  }>;
  guides: Array<Omit<CompanionMemoryResponseDto['guides'][number], 'savedAt'> & {
    savedAt: Date;
  }>;
  milestones: Array<Omit<CompanionMemoryResponseDto['milestones'][number], 'happenedAt'> & {
    happenedAt?: Date;
  }>;
  snapshot: {
    generatedAt: Date;
    expiresAt: Date;
    stale: boolean;
    sourceMarkerCount: number;
    sourcePhotoCount: number;
    sourceGuideCount: number;
  };
}

function toDateOnlyString(value: Date) {
  return value.toISOString().slice(0, 10);
}

function toIsoString(value: Date) {
  return value.toISOString();
}

export function serializeCompanionMemory(model: CompanionMemoryModel): CompanionMemoryResponseDto {
  return {
    companion: model.companion,
    summary: {
      ...model.summary,
      firstSharedAt: model.summary.firstSharedAt ? toDateOnlyString(model.summary.firstSharedAt) : undefined,
      latestSharedAt: model.summary.latestSharedAt ? toDateOnlyString(model.summary.latestSharedAt) : undefined,
    },
    yearlySeries: model.yearlySeries,
    topRegions: model.topRegions,
    topCities: model.topCities,
    themes: model.themes,
    trips: model.trips.map((trip) => ({
      ...trip,
      startsAt: toDateOnlyString(trip.startsAt),
      endsAt: toDateOnlyString(trip.endsAt),
    })),
    photos: model.photos.map((photo) => ({
      ...photo,
      visitedStartAt: toDateOnlyString(photo.visitedStartAt),
    })),
    guides: model.guides.map((guide) => ({
      ...guide,
      savedAt: toIsoString(guide.savedAt),
    })),
    milestones: model.milestones.map((milestone) => ({
      ...milestone,
      happenedAt: milestone.happenedAt ? toDateOnlyString(milestone.happenedAt) : undefined,
    })),
    snapshot: {
      generatedAt: toIsoString(model.snapshot.generatedAt),
      expiresAt: toIsoString(model.snapshot.expiresAt),
      stale: model.snapshot.stale,
      sourceMarkerCount: model.snapshot.sourceMarkerCount,
      sourcePhotoCount: model.snapshot.sourcePhotoCount,
      sourceGuideCount: model.snapshot.sourceGuideCount,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseCompanionMemorySnapshotPayload(payload: unknown): CompanionMemoryResponseDto | null {
  if (!isRecord(payload)) {
    return null;
  }

  const response = payload as Partial<CompanionMemoryResponseDto>;
  if (!isRecord(response.companion) || !isRecord(response.summary) || !isRecord(response.snapshot)) {
    return null;
  }

  if (
    !Array.isArray(response.yearlySeries) ||
    !Array.isArray(response.topRegions) ||
    !Array.isArray(response.topCities) ||
    !Array.isArray(response.themes) ||
    !Array.isArray(response.trips) ||
    !Array.isArray(response.photos) ||
    !Array.isArray(response.guides) ||
    !Array.isArray(response.milestones)
  ) {
    return null;
  }

  return response as CompanionMemoryResponseDto;
}
