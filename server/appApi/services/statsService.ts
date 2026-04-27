import { createNotFoundError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import { getStatsOverviewSource } from '../repositories/statsRepository.js';
import type { AnnualReviewQuery, StatsOverviewQuery } from '../schemas/stats.js';
import { serializeStatsOverview, type StatsOverviewModel } from '../serializers/statsSerializer.js';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import type { AnnualReviewResponseDto } from '../types.js';
import {
  buildAnnualGuides,
  buildAnnualTripHighlights,
  buildAvailableYears,
  buildCompanionRanking,
  buildHeatmap,
  buildMonthlyDistribution,
  buildTopBudgetLevels,
  buildTopMoods,
  buildTopTags,
  buildTopTransports,
  buildTopWeather,
  buildPhotos,
  buildSummary,
  buildTopCities,
  buildTopRegions,
  buildTripDetails,
  buildTripHighlights,
  buildTripRanking,
  buildYearlySeries,
  serializeAnnualMarker,
  toDateOnlyString,
  toIsoString,
  withBudgetLevelFilter,
  withCompanionFilter,
  withMoodFilter,
  withScopeFilter,
  withTagFilter,
  withTransportFilter,
  withTripFilter,
  withWeatherFilter,
  withYearFilter,
  type RawCompanion,
  type RawTrip,
} from './stats/aggregator.js';

// stats 服务：编排层，负责读取数据源、过滤以及调用聚合器。
// stats service: orchestration layer that loads the data source, applies filters, and invokes
// the pure aggregator helpers from ./stats/aggregator.ts.
// 纯聚合逻辑与国家映射已下沉到 ./stats/ 子目录，本文件只保留 I/O + 组装。
// Pure aggregation logic and country mapping have moved into ./stats/, keeping this file focused
// on I/O and composition.

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
    withBudgetLevelFilter(
      withTransportFilter(
        withWeatherFilter(
          withMoodFilter(
            withTagFilter(
              withCompanionFilter(withScopeFilter(allMarkers, query.scope), query.companionId),
              query.tag,
            ),
            query.mood,
          ),
          query.weather,
        ),
        query.transport,
      ),
      query.budgetLevel,
    ),
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
      tag: query.tag,
      mood: query.mood,
      weather: query.weather,
      transport: query.transport,
      budgetLevel: query.budgetLevel,
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
    topTags: buildTopTags(filteredMarkers),
    topMoods: buildTopMoods(filteredMarkers),
    topWeather: buildTopWeather(filteredMarkers),
    topTransports: buildTopTransports(filteredMarkers),
    topBudgetLevels: buildTopBudgetLevels(filteredMarkers),
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
