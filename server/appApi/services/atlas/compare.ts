import type { AtlasCompareDto } from '../../types.js';
import { countTravelDays, getYear, normalizeRegion, type RawCompanion, type RawMarker } from '../stats/aggregator.js';

function uniqueCount<T>(values: T[]) {
  return new Set(values).size;
}

export function buildAtlasCompare(markers: RawMarker[], companions: RawCompanion[]): AtlasCompareDto {
  const companionById = new Map(companions.map((companion) => [companion.id, companion]));
  const years = new Map<string, RawMarker[]>();
  const companionMarkers = new Map<string, RawMarker[]>();
  const scopes = new Map<RawMarker['scope'], RawMarker[]>();

  markers.forEach((marker) => {
    const year = getYear(marker.visitedStartAt);
    years.set(year, [...(years.get(year) ?? []), marker]);
    companionMarkers.set(marker.companionId, [...(companionMarkers.get(marker.companionId) ?? []), marker]);
    scopes.set(marker.scope, [...(scopes.get(marker.scope) ?? []), marker]);
  });

  return {
    years: Array.from(years.entries())
      .map(([year, list]) => ({
        year,
        markerCount: list.length,
        travelDays: countTravelDays(list),
        cityCount: uniqueCount(list.map((marker) => `${marker.scope}:${marker.scopeId}:${marker.city}`)),
        photoCount: list.reduce((sum, marker) => sum + marker.images.length, 0),
      }))
      .sort((left, right) => right.year.localeCompare(left.year)),
    companions: Array.from(companionMarkers.entries())
      .map(([companionId, list]) => {
        const companion = companionById.get(companionId);
        return {
          companionId,
          companionName: companion?.name ?? '未知旅伴',
          color: companion?.color ?? '#64748b',
          markerCount: list.length,
          travelDays: countTravelDays(list),
          cityCount: uniqueCount(list.map((marker) => `${marker.scope}:${marker.scopeId}:${marker.city}`)),
          photoCount: list.reduce((sum, marker) => sum + marker.images.length, 0),
        };
      })
      .sort((left, right) => right.markerCount - left.markerCount || left.companionName.localeCompare(right.companionName)),
    scopes: Array.from(scopes.entries())
      .map(([scope, list]) => ({
        scope,
        markerCount: list.length,
        cityCount: uniqueCount(list.map((marker) => `${marker.scope}:${marker.scopeId}:${marker.city}`)),
        regionCount: uniqueCount(list.map((marker) => `${normalizeRegion(marker).scope}:${normalizeRegion(marker).scopeId}`)),
        photoCount: list.reduce((sum, marker) => sum + marker.images.length, 0),
      }))
      .sort((left, right) => left.scope.localeCompare(right.scope)),
  };
}
