import type { AtlasReplayItemDto, AtlasTripOptionDto } from '../../types.js';
import {
  normalizeMarkerBudgetLevel,
  normalizeMarkerMood,
  normalizeMarkerTags,
  normalizeMarkerTransport,
  normalizeMarkerWeather,
} from '../../serializers/bootstrap/markers.js';
import { toDateOnlyString, type RawCompanion, type RawMarker, type RawTrip } from '../stats/aggregator.js';

export function buildAtlasReplayItems(markers: RawMarker[], companions: RawCompanion[], trips: RawTrip[]): AtlasReplayItemDto[] {
  const companionById = new Map(companions.map((companion) => [companion.id, companion]));
  const tripById = new Map(trips.map((trip) => [trip.id, trip]));
  return [...markers]
    .sort((left, right) => left.visitedStartAt.getTime() - right.visitedStartAt.getTime())
    .map((marker, index) => {
      const companion = companionById.get(marker.companionId);
      const trip = marker.tripId ? tripById.get(marker.tripId) : undefined;
      const featuredPhoto = marker.images.find((image) => image.isFeatured) ?? marker.images[0];
      const tripDto: AtlasTripOptionDto | undefined = trip
        ? {
            id: trip.id,
            name: trip.name,
            startsAt: toDateOnlyString(trip.startsAt),
            endsAt: toDateOnlyString(trip.endsAt),
          }
        : undefined;
      return {
        id: `replay-${marker.id}`,
        order: index + 1,
        markerId: marker.id,
        title: `${marker.scopeName} · ${marker.city}`,
        description: marker.note,
        visitedStartAt: toDateOnlyString(marker.visitedStartAt),
        visitedEndAt: toDateOnlyString(marker.visitedEndAt),
        scope: marker.scope,
        scopeId: marker.scopeId,
        scopeName: marker.scopeName,
        city: marker.city,
        companion: {
          id: companion?.id ?? marker.companionId,
          name: companion?.name ?? '未知旅伴',
          color: companion?.color ?? '#64748b',
        },
        trip: tripDto,
        photo: featuredPhoto
          ? {
              imageId: featuredPhoto.id,
              imageUrl: featuredPhoto.imageUrl,
              caption: featuredPhoto.caption ?? undefined,
              isFeatured: featuredPhoto.isFeatured,
            }
          : undefined,
        metadata: {
          tags: normalizeMarkerTags(marker.tags) ?? [],
          mood: normalizeMarkerMood(marker.mood) ?? undefined,
          weather: normalizeMarkerWeather(marker.weather) ?? undefined,
          transport: normalizeMarkerTransport(marker.transport) ?? undefined,
          budgetLevel: normalizeMarkerBudgetLevel(marker.budgetLevel) ?? undefined,
        },
      };
    });
}
