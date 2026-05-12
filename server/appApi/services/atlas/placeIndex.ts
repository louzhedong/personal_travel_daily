import type { AtlasPlaceIndexDto } from '../../types.js';
import { normalizeRegion, toDateOnlyString, type RawMarker } from '../stats/aggregator.js';

function updateBounds(target: { firstVisitedAt?: Date; latestVisitedAt?: Date }, marker: RawMarker) {
  if (!target.firstVisitedAt || marker.visitedStartAt < target.firstVisitedAt) {
    target.firstVisitedAt = marker.visitedStartAt;
  }
  if (!target.latestVisitedAt || marker.visitedStartAt > target.latestVisitedAt) {
    target.latestVisitedAt = marker.visitedStartAt;
  }
}

export function buildAtlasPlaceIndex(markers: RawMarker[]): AtlasPlaceIndexDto {
  const regions = new Map<
    string,
    {
      scope: RawMarker['scope'];
      scopeId: string;
      scopeName: string;
      markerCount: number;
      photoCount: number;
      firstVisitedAt?: Date;
      latestVisitedAt?: Date;
      cities: Map<string, { city: string; markerCount: number; photoCount: number; firstVisitedAt?: Date; latestVisitedAt?: Date }>;
    }
  >();

  markers.forEach((marker) => {
    const region = normalizeRegion(marker);
    const key = `${region.scope}:${region.scopeId}`;
    const current = regions.get(key) ?? {
      scope: region.scope,
      scopeId: region.scopeId,
      scopeName: region.scopeName,
      markerCount: 0,
      photoCount: 0,
      firstVisitedAt: undefined,
      latestVisitedAt: undefined,
      cities: new Map(),
    };
    current.markerCount += 1;
    current.photoCount += marker.images.length;
    updateBounds(current, marker);

    const city = current.cities.get(marker.city) ?? {
      city: marker.city,
      markerCount: 0,
      photoCount: 0,
      firstVisitedAt: undefined,
      latestVisitedAt: undefined,
    };
    city.markerCount += 1;
    city.photoCount += marker.images.length;
    updateBounds(city, marker);
    current.cities.set(marker.city, city);
    regions.set(key, current);
  });

  return {
    regions: Array.from(regions.values())
      .map((region) => ({
        scope: region.scope,
        scopeId: region.scopeId,
        scopeName: region.scopeName,
        markerCount: region.markerCount,
        photoCount: region.photoCount,
        firstVisitedAt: region.firstVisitedAt ? toDateOnlyString(region.firstVisitedAt) : undefined,
        latestVisitedAt: region.latestVisitedAt ? toDateOnlyString(region.latestVisitedAt) : undefined,
        cities: Array.from(region.cities.values())
          .map((city) => ({
            city: city.city,
            markerCount: city.markerCount,
            photoCount: city.photoCount,
            firstVisitedAt: city.firstVisitedAt ? toDateOnlyString(city.firstVisitedAt) : undefined,
            latestVisitedAt: city.latestVisitedAt ? toDateOnlyString(city.latestVisitedAt) : undefined,
          }))
          .sort((left, right) => right.markerCount - left.markerCount || left.city.localeCompare(right.city)),
      }))
      .sort((left, right) => right.markerCount - left.markerCount || left.scopeName.localeCompare(right.scopeName)),
  };
}
