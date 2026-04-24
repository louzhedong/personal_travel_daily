import type { GuideSearchScope, TravelScope } from '@prisma/client';
import { createNotFoundError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import { getStatsOverviewSource } from '../repositories/statsRepository.js';
import type { AnnualReviewQuery, StatsOverviewQuery } from '../schemas/stats.js';
import { serializeStatsOverview, type StatsOverviewModel } from '../serializers/statsSerializer.js';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import type { AnnualReviewResponseDto } from '../types.js';

type RawStatsSource = NonNullable<Awaited<ReturnType<typeof getStatsOverviewSource>>>;
type RawCompanion = RawStatsSource['companions'][number];
type RawTrip = RawStatsSource['trips'][number];
type RawMarker = RawStatsSource['markers'][number];

type AggregatedRegion = {
  scopeId: string;
  scopeName: string;
  scope: TravelScope;
  markerCount: number;
};

const INTERNATIONAL_COUNTRY_BY_SCOPE_PREFIX: Record<string, { scopeId: string; scopeName: string }> = {
  jp: { scopeId: 'jp', scopeName: '日本' },
  kr: { scopeId: 'kr', scopeName: '韩国' },
  fr: { scopeId: 'fr', scopeName: '法国' },
  it: { scopeId: 'it', scopeName: '意大利' },
  ch: { scopeId: 'ch', scopeName: '瑞士' },
  us: { scopeId: 'us', scopeName: '美国' },
  ca: { scopeId: 'ca', scopeName: '加拿大' },
  au: { scopeId: 'au', scopeName: '澳大利亚' },
  nz: { scopeId: 'nz', scopeName: '新西兰' },
  th: { scopeId: 'th', scopeName: '泰国' },
  vn: { scopeId: 'vn', scopeName: '越南' },
  sg: { scopeId: 'sg', scopeName: '新加坡' },
  my: { scopeId: 'my', scopeName: '马来西亚' },
  id: { scopeId: 'id', scopeName: '印度尼西亚' },
  in: { scopeId: 'in', scopeName: '印度' },
  gb: { scopeId: 'gb', scopeName: '英国' },
  de: { scopeId: 'de', scopeName: '德国' },
  es: { scopeId: 'es', scopeName: '西班牙' },
  pt: { scopeId: 'pt', scopeName: '葡萄牙' },
  gr: { scopeId: 'gr', scopeName: '希腊' },
  tr: { scopeId: 'tr', scopeName: '土耳其' },
  ru: { scopeId: 'ru', scopeName: '俄罗斯' },
  br: { scopeId: 'br', scopeName: '巴西' },
  ar: { scopeId: 'ar', scopeName: '阿根廷' },
  mx: { scopeId: 'mx', scopeName: '墨西哥' },
  cn: { scopeId: 'cn', scopeName: '中国' },
  hk: { scopeId: 'cn', scopeName: '中国' },
  mo: { scopeId: 'cn', scopeName: '中国' },
  tw: { scopeId: 'cn', scopeName: '中国' },
};

function toDateOnlyString(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getYear(value: Date) {
  return value.toISOString().slice(0, 4);
}

function getMonth(value: Date) {
  return value.toISOString().slice(5, 7);
}

function enumerateDateKeys(startAt: Date, endAt: Date) {
  const start = new Date(Date.UTC(startAt.getUTCFullYear(), startAt.getUTCMonth(), startAt.getUTCDate()));
  const end = new Date(Date.UTC(endAt.getUTCFullYear(), endAt.getUTCMonth(), endAt.getUTCDate()));
  const keys: string[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    keys.push(cursor.toISOString().slice(0, 10));
  }
  return keys;
}

function countTravelDays(markers: RawMarker[]) {
  const uniqueDays = new Set<string>();
  markers.forEach((marker) => {
    enumerateDateKeys(marker.visitedStartAt, marker.visitedEndAt).forEach((day) => uniqueDays.add(day));
  });
  return uniqueDays.size;
}

function normalizeDomesticRegionName(scopeName: string) {
  return scopeName
    .replace(/维吾尔自治区$/, '')
    .replace(/壮族自治区$/, '')
    .replace(/回族自治区$/, '')
    .replace(/自治区$/, '')
    .replace(/特别行政区$/, '')
    .replace(/省$/, '')
    .replace(/市$/, '');
}

function normalizeInternationalCountry(marker: RawMarker) {
  const prefix = marker.scopeId.split('-')[0]?.toLowerCase() ?? marker.scopeId.toLowerCase();
  return INTERNATIONAL_COUNTRY_BY_SCOPE_PREFIX[prefix] ?? { scopeId: marker.scopeId, scopeName: marker.scopeName };
}

function normalizeRegion(marker: RawMarker) {
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

function buildAggregatedRegions(markers: RawMarker[]) {
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

function rankByCount<T extends { markerCount: number }>(items: T[]) {
  return [...items].sort((left, right) => {
    if (right.markerCount !== left.markerCount) {
      return right.markerCount - left.markerCount;
    }
    return JSON.stringify(left).localeCompare(JSON.stringify(right));
  });
}

function withScopeFilter(markers: RawMarker[], scope: TravelScope | 'all') {
  if (scope === 'all') {
    return markers;
  }
  return markers.filter((marker) => marker.scope === scope);
}

function withCompanionFilter(markers: RawMarker[], companionId?: string) {
  if (!companionId) {
    return markers;
  }
  return markers.filter((marker) => marker.companionId === companionId);
}

function withTripFilter(markers: RawMarker[], tripId?: string) {
  if (!tripId) {
    return markers;
  }
  if (tripId === 'unassigned') {
    return markers.filter((marker) => !marker.tripId);
  }
  return markers.filter((marker) => marker.tripId === tripId);
}

function withYearFilter(markers: RawMarker[], year?: string) {
  if (!year) {
    return markers;
  }
  return markers.filter((marker) => getYear(marker.visitedStartAt) === year);
}

function buildSummary(markers: RawMarker[], tripDetails: StatsOverviewModel['tripDetails']) {
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

function buildYearlySeries(markers: RawMarker[]) {
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

function buildMonthlyDistribution(markers: RawMarker[]) {
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

function buildTopRegions(markers: RawMarker[]) {
  return buildAggregatedRegions(markers).slice(0, 8);
}

function buildTopCities(markers: RawMarker[]) {
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

function buildCompanionRanking(markers: RawMarker[], companions: RawCompanion[]) {
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

function buildTripDetails(markers: RawMarker[], trips: RawTrip[]) {
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

function buildTripRanking(tripDetails: StatsOverviewModel['tripDetails']) {
  return tripDetails.slice(0, 8).map((trip) => ({
    tripId: trip.tripId,
    tripName: trip.tripName,
    markerCount: trip.markerCount,
    travelDays: trip.travelDays,
    startsAt: trip.startsAt,
    endsAt: trip.endsAt,
  }));
}

function buildTripHighlights(tripDetails: StatsOverviewModel['tripDetails']) {
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

function buildHeatmap(markers: RawMarker[]) {
  const allRegions = buildAggregatedRegions(markers);
  const maxCount = Math.max(...allRegions.map((item) => item.markerCount), 0);
  return allRegions.map((item) => ({
    ...item,
    intensity: maxCount > 0 ? Math.max(1, Math.ceil((item.markerCount / maxCount) * 5)) : 0,
  }));
}

function toIsoString(value: Date) {
  return value.toISOString();
}

function buildPhotos(markers: RawMarker[]): AnnualReviewResponseDto['photos'] {
  return markers
    .flatMap((marker) =>
      marker.images.map((image) => ({
        markerId: marker.id,
        markerTitle: `${marker.scopeName} 路 ${marker.city}`,
        imageUrl: image.imageUrl,
        visitedStartAt: toDateOnlyString(marker.visitedStartAt),
        scopeName: marker.scopeName,
        city: marker.city,
      })),
    )
    .sort((left, right) => left.visitedStartAt.localeCompare(right.visitedStartAt));
}

function buildAnnualGuides(markers: RawMarker[]): AnnualReviewResponseDto['guides'] {
  const guides = new Map<string, AnnualReviewResponseDto['guides'][number]>();

  markers.forEach((marker) => {
    marker.savedGuides.forEach((guide) => {
      const current = guides.get(guide.guideIdentity);
      const item = {
        id: guide.id,
        markerId: guide.markerId ?? undefined,
        keyword: guide.keyword,
        savedAt: toIsoString(guide.savedAt),
        title: guide.guideTitle,
        summary: guide.guideSummary,
        sourceName: guide.guideSourceName,
        sourceUrl: guide.guideSourceUrl,
      };

      if (!current || item.savedAt > current.savedAt) {
        guides.set(guide.guideIdentity, item);
      }
    });
  });

  return Array.from(guides.values()).sort((left, right) => right.savedAt.localeCompare(left.savedAt)).slice(0, 8);
}

function serializeAnnualMarker(marker: RawMarker): AnnualReviewResponseDto['firstMarker'] {
  return {
    id: marker.id,
    tripId: marker.tripId ?? undefined,
    companionId: marker.companionId,
    companionName: marker.companion.name,
    companionColor: marker.companion.color,
    scope: marker.scope,
    scopeId: marker.scopeId,
    scopeName: marker.scopeName,
    city: marker.city,
    note: marker.note,
    visitedStartAt: toDateOnlyString(marker.visitedStartAt),
    visitedEndAt: toDateOnlyString(marker.visitedEndAt),
  };
}

function buildAnnualTripHighlights(
  monthlyDistribution: AnnualReviewResponseDto['monthlyDistribution'],
  companionRanking: AnnualReviewResponseDto['companionRanking'],
  tripDetails: StatsOverviewModel['tripDetails'],
  topRegions: AnnualReviewResponseDto['topRegions'],
  topCities: AnnualReviewResponseDto['topCities'],
) {
  const baseHighlights = buildTripHighlights(tripDetails);
  const busiestMonth = [...monthlyDistribution].sort((left, right) => {
    if (right.markerCount !== left.markerCount) {
      return right.markerCount - left.markerCount;
    }
    if (right.travelDays !== left.travelDays) {
      return right.travelDays - left.travelDays;
    }
    return left.month.localeCompare(right.month);
  })[0];

  return {
    ...baseHighlights,
    busiestMonth: busiestMonth && busiestMonth.markerCount > 0 ? busiestMonth : undefined,
    topCompanion: companionRanking[0],
    topRegion: topRegions[0],
    topCity: topCities[0],
  };
}

function assertCompanionExists(companions: RawCompanion[], companionId?: string) {
  if (!companionId) {
    return;
  }
  if (!companions.some((companion) => companion.id === companionId)) {
    throw createNotFoundError('companion not found');
  }
}

function assertTripExists(trips: RawTrip[], tripId?: string) {
  if (!tripId || tripId === 'unassigned') {
    return;
  }
  if (!trips.some((trip) => trip.id === tripId)) {
    throw createNotFoundError('trip not found');
  }
}

function buildAvailableYears(markers: RawMarker[]) {
  return Array.from(new Set(markers.map((marker) => getYear(marker.visitedStartAt)))).sort((left, right) =>
    right.localeCompare(left),
  );
}

export async function getStatsOverview(account: AuthenticatedAccount, query: StatsOverviewQuery) {
  const prisma = getPrismaClient();
  const source = await getStatsOverviewSource(prisma, account.id);

  if (!source) {
    throw createNotFoundError('account not found');
  }

  assertCompanionExists(source.companions, query.companionId);
  assertTripExists(source.trips, query.tripId);

  const allMarkers = source.markers;
  const yearAgnosticMarkers = withTripFilter(
    withCompanionFilter(withScopeFilter(allMarkers, query.scope), query.companionId),
    query.tripId,
  );
  const filteredMarkers = withYearFilter(yearAgnosticMarkers, query.year);

  const tripDetails = buildTripDetails(filteredMarkers, source.trips);

  const model: StatsOverviewModel = {
    filters: {
      year: query.year ?? 'all',
      scope: query.scope,
      companionId: query.companionId,
      tripId: query.tripId as StatsOverviewModel['filters']['tripId'],
    },
    availableYears: buildAvailableYears(allMarkers),
    companions: source.companions.map((companion) => ({
      id: companion.id,
      name: companion.name,
      color: companion.color,
    })),
    trips: source.trips.map((trip) => ({
      id: trip.id,
      name: trip.name,
      startsAt: trip.startsAt,
      endsAt: trip.endsAt,
    })),
    summary: buildSummary(filteredMarkers, tripDetails),
    yearlySeries: buildYearlySeries(yearAgnosticMarkers),
    monthlyDistribution: buildMonthlyDistribution(filteredMarkers),
    topRegions: buildTopRegions(filteredMarkers),
    topCities: buildTopCities(filteredMarkers),
    companionRanking: buildCompanionRanking(filteredMarkers, source.companions),
    tripRanking: buildTripRanking(tripDetails),
    tripDetails,
    tripHighlights: buildTripHighlights(tripDetails),
    heatmap: buildHeatmap(filteredMarkers),
    generatedAt: new Date(),
  };

  return serializeStatsOverview(model);
}

export async function getAnnualReview(account: AuthenticatedAccount, query: AnnualReviewQuery) {
  const prisma = getPrismaClient();
  const source = await getStatsOverviewSource(prisma, account.id);

  if (!source) {
    throw createNotFoundError('account not found');
  }

  const filteredMarkers = withYearFilter(source.markers, query.year);
  const chronologicalMarkers = [...filteredMarkers].sort(
    (left, right) => left.visitedStartAt.getTime() - right.visitedStartAt.getTime(),
  );
  const tripDetails = buildTripDetails(filteredMarkers, source.trips);
  const monthlyDistribution = buildMonthlyDistribution(filteredMarkers);
  const topRegions = buildTopRegions(filteredMarkers);
  const topCities = buildTopCities(filteredMarkers);
  const companionRanking = buildCompanionRanking(filteredMarkers, source.companions);
  const photos = buildPhotos(chronologicalMarkers).slice(0, 12);
  const guides = buildAnnualGuides(filteredMarkers);
  const summary = {
    ...buildSummary(filteredMarkers, tripDetails),
    photoCount: filteredMarkers.reduce((total, marker) => total + marker.images.length, 0),
    guideCount: guides.length,
  };

  return {
    year: query.year,
    availableYears: buildAvailableYears(source.markers),
    summary,
    monthlyDistribution,
    topRegions,
    topCities,
    companionRanking,
    tripHighlights: buildAnnualTripHighlights(
      monthlyDistribution,
      companionRanking,
      tripDetails,
      topRegions,
      topCities,
    ),
    heatmap: buildHeatmap(filteredMarkers),
    representativePhoto: photos[0],
    photos,
    guides,
    trips: tripDetails.map((trip) => ({
      ...trip,
      startsAt: toDateOnlyString(trip.startsAt),
      endsAt: toDateOnlyString(trip.endsAt),
    })),
    firstMarker: chronologicalMarkers[0] ? serializeAnnualMarker(chronologicalMarkers[0]) : undefined,
    lastMarker:
      chronologicalMarkers.length > 0
        ? serializeAnnualMarker(chronologicalMarkers[chronologicalMarkers.length - 1])
        : undefined,
    generatedAt: toIsoString(new Date()),
  } satisfies AnnualReviewResponseDto;
}
