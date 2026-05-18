import type { TravelScope } from '@prisma/client';
import type { StatsOverviewModel } from '../../../serializers/statsSerializer.js';
import { normalizeMarkerTags } from '../../../serializers/bootstrap/markers.js';
import { getYear } from './dates.js';
import type { RawMarker } from './types.js';

export function withScopeFilter(markers: RawMarker[], scope: TravelScope | 'all') {
  if (scope === 'all') {
    return markers;
  }
  return markers.filter((marker) => marker.scope === scope);
}

export function withCompanionFilter(markers: RawMarker[], companionId?: string) {
  if (!companionId) {
    return markers;
  }
  return markers.filter((marker) => marker.companionId === companionId);
}

export function withTripFilter(markers: RawMarker[], tripId?: string) {
  if (!tripId) {
    return markers;
  }
  if (tripId === 'unassigned') {
    return markers.filter((marker) => !marker.tripId);
  }
  return markers.filter((marker) => marker.tripId === tripId);
}

export function withYearFilter(markers: RawMarker[], year?: string) {
  if (!year) {
    return markers;
  }
  return markers.filter((marker) => getYear(marker.visitedStartAt) === year);
}

export function withTagFilter(markers: RawMarker[], tag?: StatsOverviewModel['filters']['tag']) {
  if (!tag || tag === 'all') {
    return markers;
  }
  return markers.filter((marker) => normalizeMarkerTags(marker.tags)?.includes(tag) ?? false);
}

export function withMoodFilter(markers: RawMarker[], mood?: StatsOverviewModel['filters']['mood']) {
  if (!mood || mood === 'all') {
    return markers;
  }
  return markers.filter((marker) => marker.mood === mood);
}

export function withWeatherFilter(markers: RawMarker[], weather?: StatsOverviewModel['filters']['weather']) {
  if (!weather || weather === 'all') {
    return markers;
  }
  return markers.filter((marker) => marker.weather === weather);
}

export function withTransportFilter(markers: RawMarker[], transport?: StatsOverviewModel['filters']['transport']) {
  if (!transport || transport === 'all') {
    return markers;
  }
  return markers.filter((marker) => marker.transport === transport);
}

export function withBudgetLevelFilter(markers: RawMarker[], budgetLevel?: StatsOverviewModel['filters']['budgetLevel']) {
  if (!budgetLevel || budgetLevel === 'all') {
    return markers;
  }
  return markers.filter((marker) => marker.budgetLevel === budgetLevel);
}
