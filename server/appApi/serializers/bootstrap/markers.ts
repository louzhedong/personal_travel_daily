// bootstrap serializer - markers / 打卡点序列化。
// bootstrap serializer - visit marker serialization.
import type { VisitMarkerImage } from '@prisma/client';
import {
  MARKER_BUDGET_LEVELS,
  MARKER_MOODS,
  MARKER_TRANSPORTS,
  MARKER_WEATHERS,
  type MarkerBudgetLevel,
  type MarkerMood,
  type MarkerTag,
  type MarkerTransport,
  type MarkerWeather,
} from '../../../../shared/markerMetadata.js';
import type { VisitMarkerDto } from '../../types.js';
import { toDateOnlyString, toIsoString } from './shared.js';

export type MarkerWithImages = {
  id: string;
  companionId: string;
  tripId: string | null;
  scope: 'domestic' | 'international';
  scopeId: string;
  scopeName: string;
  city: string;
  note: string;
  tags: unknown;
  mood: string | null;
  weather: string | null;
  transport: string | null;
  budgetLevel: string | null;
  visitedStartAt: Date;
  visitedEndAt: Date;
  createdAt: Date;
  images: VisitMarkerImage[];
};

export function normalizeMarkerTags(value: unknown): MarkerTag[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalized = value.filter((item): item is MarkerTag => typeof item === 'string' && /^[a-z0-9][a-z0-9_-]{1,31}$/.test(item));
  return normalized.length > 0 ? normalized : undefined;
}

export function normalizeMarkerMood(value: string | null): MarkerMood | undefined {
  return value && MARKER_MOODS.includes(value as MarkerMood) ? (value as MarkerMood) : undefined;
}

export function normalizeMarkerWeather(value: string | null): MarkerWeather | undefined {
  return value && MARKER_WEATHERS.includes(value as MarkerWeather) ? (value as MarkerWeather) : undefined;
}

export function normalizeMarkerTransport(value: string | null): MarkerTransport | undefined {
  return value && MARKER_TRANSPORTS.includes(value as MarkerTransport) ? (value as MarkerTransport) : undefined;
}

export function normalizeMarkerBudgetLevel(value: string | null): MarkerBudgetLevel | undefined {
  return value && MARKER_BUDGET_LEVELS.includes(value as MarkerBudgetLevel) ? (value as MarkerBudgetLevel) : undefined;
}

export function serializeMarker(marker: MarkerWithImages): VisitMarkerDto {
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
    tags: normalizeMarkerTags(marker.tags),
    mood: normalizeMarkerMood(marker.mood),
    weather: normalizeMarkerWeather(marker.weather),
    transport: normalizeMarkerTransport(marker.transport),
    budgetLevel: normalizeMarkerBudgetLevel(marker.budgetLevel),
    imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    visitedStartAt: toDateOnlyString(marker.visitedStartAt),
    visitedEndAt: toDateOnlyString(marker.visitedEndAt),
    createdAt: toIsoString(marker.createdAt),
  };
}
