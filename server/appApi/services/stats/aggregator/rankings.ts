import type { TravelScope } from '@prisma/client';
import {
  MARKER_BUDGET_LEVELS,
  MARKER_MOODS,
  MARKER_TRANSPORTS,
  MARKER_WEATHERS,
} from '../../../../../shared/markerMetadata.js';
import { INTERNATIONAL_COUNTRY_BY_SCOPE_PREFIX } from '../countryMapping.js';
import type { StatsOverviewModel } from '../../../serializers/statsSerializer.js';
import {
  normalizeMarkerBudgetLevel,
  normalizeMarkerMood,
  normalizeMarkerTags,
  normalizeMarkerTransport,
  normalizeMarkerWeather,
} from '../../../serializers/bootstrap/markers.js';
import { countTravelDays, getMonth, getYear } from './dates.js';
import type { AggregatedRegion, RawCompanion, RawMarker, RawTrip } from './types.js';

export function normalizeDomesticRegionName(scopeName: string) {
  return scopeName
    .replace(/维吾尔自治区$/, '')
    .replace(/壮族自治区$/, '')
    .replace(/回族自治区$/, '')
    .replace(/自治区$/, '')
    .replace(/特别行政区$/, '')
    .replace(/省$/, '')
    .replace(/市$/, '');
}

export function normalizeInternationalCountry(marker: RawMarker) {
  const prefix = marker.scopeId.split('-')[0]?.toLowerCase() ?? marker.scopeId.toLowerCase();
  return INTERNATIONAL_COUNTRY_BY_SCOPE_PREFIX[prefix] ?? { scopeId: marker.scopeId, scopeName: marker.scopeName };
}

export function normalizeRegion(marker: RawMarker) {
  if (marker.scope === 'domestic') {
    return {
      scopeId: marker.scopeId,
      scopeName: normalizeDomesticRegionName(marker.scopeName),
      scope: marker.scope,
    } satisfies Omit<AggregatedRegion, 'markerCount'>;
  }

  return {
    ...normalizeInternationalCountry(marker),
    scope: marker.scope,
  } satisfies Omit<AggregatedRegion, 'markerCount'>;
}

export function rankByCount<T extends { markerCount: number }>(items: T[]) {
  return [...items].sort((left, right) => {
    if (right.markerCount !== left.markerCount) {
      return right.markerCount - left.markerCount;
    }
    return JSON.stringify(left).localeCompare(JSON.stringify(right));
  });
}

export function buildAggregatedRegions(markers: RawMarker[]) {
  const regions = new Map<string, AggregatedRegion>();
  markers.forEach((marker) => {
    const normalized = normalizeRegion(marker);
    const key = `${normalized.scope}:${normalized.scopeId}`;
    const current = regions.get(key) ?? {
      ...normalized,
      markerCount: 0,
    };
    current.markerCount += 1;
    regions.set(key, current);
  });

  return rankByCount(Array.from(regions.values()));
}

function buildMetadataRanking(
  counts: Map<string, number>,
  labels: Record<string, string>,
): StatsOverviewModel['topTags'] {
  return Array.from(counts.entries())
    .map(([value, markerCount]) => ({
      value,
      label: labels[value] ?? value,
      markerCount,
    }))
    .sort((left, right) => {
      if (right.markerCount !== left.markerCount) {
        return right.markerCount - left.markerCount;
      }
      return left.label.localeCompare(right.label);
    })
    .slice(0, 8);
}

export function buildTopTags(markers: RawMarker[], labels: Record<string, string> = {}) {
  const counts = new Map<string, number>();
  markers.forEach((marker) => {
    const tags = normalizeMarkerTags(marker.tags);
    if (!tags) {
      return;
    }
    tags.forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  });
  return buildMetadataRanking(counts, labels);
}

export function buildTopMoods(markers: RawMarker[]) {
  const counts = new Map<string, number>();
  markers.forEach((marker) => {
    const mood = normalizeMarkerMood(marker.mood);
    if (mood) {
      counts.set(mood, (counts.get(mood) ?? 0) + 1);
    }
  });
  return buildMetadataRanking(
    counts,
    Object.fromEntries(
      MARKER_MOODS.map((value) => [
        value,
        { relaxed: '放松', excited: '兴奋', tired: '疲惫', surprised: '惊喜', peaceful: '平静' }[value],
      ]),
    ),
  );
}

export function buildTopWeather(markers: RawMarker[]) {
  const counts = new Map<string, number>();
  markers.forEach((marker) => {
    const weather = normalizeMarkerWeather(marker.weather);
    if (weather) {
      counts.set(weather, (counts.get(weather) ?? 0) + 1);
    }
  });
  return buildMetadataRanking(
    counts,
    Object.fromEntries(
      MARKER_WEATHERS.map((value) => [
        value,
        { sunny: '晴', cloudy: '多云', rainy: '雨', snowy: '雪', windy: '大风' }[value],
      ]),
    ),
  );
}

export function buildTopTransports(markers: RawMarker[]) {
  const counts = new Map<string, number>();
  markers.forEach((marker) => {
    const transport = normalizeMarkerTransport(marker.transport);
    if (transport) {
      counts.set(transport, (counts.get(transport) ?? 0) + 1);
    }
  });
  return buildMetadataRanking(
    counts,
    Object.fromEntries(
      MARKER_TRANSPORTS.map((value) => [
        value,
        { walk: '步行', car: '自驾', train: '火车', plane: '飞机', metro: '地铁', bus: '公交/大巴' }[value],
      ]),
    ),
  );
}

export function buildTopBudgetLevels(markers: RawMarker[]) {
  const counts = new Map<string, number>();
  markers.forEach((marker) => {
    const budgetLevel = normalizeMarkerBudgetLevel(marker.budgetLevel);
    if (budgetLevel) {
      counts.set(budgetLevel, (counts.get(budgetLevel) ?? 0) + 1);
    }
  });
  return buildMetadataRanking(
    counts,
    Object.fromEntries(
      MARKER_BUDGET_LEVELS.map((value) => [
        value,
        { low: '低预算', medium: '中预算', high: '高预算' }[value],
      ]),
    ),
  );
}

export function buildSummary(markers: RawMarker[], tripDetails: StatsOverviewModel['tripDetails']) {
  const totalTrips = new Set(markers.map((marker) => marker.tripId).filter(Boolean)).size;
  const totalCities = new Set(markers.map((marker) => `${marker.scope}:${marker.scopeId}:${marker.city}`)).size;
  const aggregatedRegions = buildAggregatedRegions(markers);
  const totalRegions = aggregatedRegions.length;
  const totalCountries = aggregatedRegions.filter((item) => item.scope === 'international').length;
  const activeCompanions = new Set(markers.map((marker) => marker.companionId)).size;

  return {
    totalTrips,
    totalMarkers: markers.length,
    totalTravelDays: countTravelDays(markers),
    totalCities,
    totalRegions,
    totalCountries,
    activeCompanions,
    longestTripDays:
      tripDetails.length > 0
        ? Math.max(...tripDetails.map((trip) => trip.travelDays))
        : undefined,
  };
}

export function buildYearlySeries(markers: RawMarker[]) {
  const years = new Map<string, RawMarker[]>();
  markers.forEach((marker) => {
    const year = getYear(marker.visitedStartAt);
    const current = years.get(year) ?? [];
    current.push(marker);
    years.set(year, current);
  });

  return Array.from(years.entries())
    .map(([year, groupedMarkers]) => ({
      year,
      markerCount: groupedMarkers.length,
      travelDays: countTravelDays(groupedMarkers),
    }))
    .sort((left, right) => left.year.localeCompare(right.year));
}

export function buildMonthlyDistribution(markers: RawMarker[]) {
  const months = new Map<string, RawMarker[]>();
  markers.forEach((marker) => {
    const month = getMonth(marker.visitedStartAt);
    const current = months.get(month) ?? [];
    current.push(marker);
    months.set(month, current);
  });

  return Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0')).map((month) => {
    const groupedMarkers = months.get(month) ?? [];
    return {
      month,
      markerCount: groupedMarkers.length,
      travelDays: countTravelDays(groupedMarkers),
    };
  });
}

export function buildTopRegions(markers: RawMarker[]) {
  return buildAggregatedRegions(markers).slice(0, 8);
}

export function buildTopCities(markers: RawMarker[]) {
  const cities = new Map<string, { city: string; scopeName: string; scope: TravelScope; markerCount: number }>();
  markers.forEach((marker) => {
    const key = `${marker.scope}:${marker.scopeId}:${marker.city}`;
    const current = cities.get(key) ?? {
      city: marker.city,
      scopeName: marker.scopeName,
      scope: marker.scope,
      markerCount: 0,
    };
    current.markerCount += 1;
    cities.set(key, current);
  });

  return rankByCount(Array.from(cities.values())).slice(0, 8);
}

export function buildCompanionRanking(markers: RawMarker[], companions: RawCompanion[]) {
  const companionMap = new Map(companions.map((companion) => [companion.id, companion]));
  const groups = new Map<string, RawMarker[]>();

  markers.forEach((marker) => {
    const current = groups.get(marker.companionId) ?? [];
    current.push(marker);
    groups.set(marker.companionId, current);
  });

  return Array.from(groups.entries())
    .map(([companionId, groupedMarkers]) => {
      const companion = companionMap.get(companionId);
      return {
        companionId,
        companionName: companion?.name ?? '未知旅伴',
        color: companion?.color ?? '#94a3b8',
        markerCount: groupedMarkers.length,
        travelDays: countTravelDays(groupedMarkers),
      };
    })
    .sort((left, right) => {
      if (right.markerCount !== left.markerCount) {
        return right.markerCount - left.markerCount;
      }
      return left.companionName.localeCompare(right.companionName);
    });
}

export function buildTripDetails(markers: RawMarker[], trips: RawTrip[]) {
  const tripMap = new Map(trips.map((trip) => [trip.id, trip]));
  const grouped = new Map<string, RawMarker[]>();

  markers.forEach((marker) => {
    if (!marker.tripId) {
      return;
    }
    const current = grouped.get(marker.tripId) ?? [];
    current.push(marker);
    grouped.set(marker.tripId, current);
  });

  return Array.from(grouped.entries())
    .map(([tripId, groupedMarkers]) => {
      const trip = tripMap.get(tripId);
      if (!trip) {
        return null;
      }
      return {
        tripId,
        tripName: trip.name,
        markerCount: groupedMarkers.length,
        travelDays: countTravelDays(groupedMarkers),
        startsAt: trip.startsAt,
        endsAt: trip.endsAt,
        coverImageUrl: trip.coverImageUrl ?? undefined,
        note: trip.note,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((left, right) => {
      if (right.markerCount !== left.markerCount) {
        return right.markerCount - left.markerCount;
      }
      return right.startsAt.getTime() - left.startsAt.getTime();
    });
}

export function buildTripRanking(tripDetails: StatsOverviewModel['tripDetails']) {
  return tripDetails.slice(0, 8).map((trip) => ({
    tripId: trip.tripId,
    tripName: trip.tripName,
    markerCount: trip.markerCount,
    travelDays: trip.travelDays,
    startsAt: trip.startsAt,
    endsAt: trip.endsAt,
  }));
}

export function buildTripHighlights(tripDetails: StatsOverviewModel['tripDetails']) {
  if (tripDetails.length === 0) {
    return {};
  }

  const longestTrip = [...tripDetails].sort((left, right) => right.travelDays - left.travelDays)[0];
  const mostMarkersTrip = [...tripDetails].sort((left, right) => right.markerCount - left.markerCount)[0];

  return {
    longestTrip: longestTrip
      ? {
          tripId: longestTrip.tripId,
          tripName: longestTrip.tripName,
          days: longestTrip.travelDays,
        }
      : undefined,
    mostMarkersTrip: mostMarkersTrip
      ? {
          tripId: mostMarkersTrip.tripId,
          tripName: mostMarkersTrip.tripName,
          markerCount: mostMarkersTrip.markerCount,
        }
      : undefined,
  };
}

export function buildHeatmap(markers: RawMarker[]) {
  const allRegions = buildAggregatedRegions(markers);
  const maxCount = Math.max(...allRegions.map((item) => item.markerCount), 0);
  return allRegions.map((item) => ({
    ...item,
    intensity: maxCount > 0 ? Math.max(1, Math.ceil((item.markerCount / maxCount) * 5)) : 0,
  }));
}
