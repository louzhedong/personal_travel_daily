import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { createNotFoundError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import { getStatsOverviewSource } from '../repositories/statsRepository.js';
import type { AnnualReviewQuery, StatsOverviewQuery } from '../schemas/stats.js';
import { getMarkerTagLabels } from './tagVocabularyService.js';
import { serializeStatsOverview, type StatsOverviewModel } from '../serializers/statsSerializer.js';
import { buildTripExpenseSummary, buildTripExpenseTrend } from '../serializers/expenseSerializer.js';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';
import type { AnnualReviewResponseDto, StatsExpenseInsightsDto } from '../types.js';
import {
  buildAnnualGuides,
  buildAchievements,
  buildAnnualAchievements,
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

type RawExpense = NonNullable<Awaited<ReturnType<typeof getStatsOverviewSource>>>['tripExpenses'][number];

function filterExpenses(
  expenses: RawExpense[],
  query: {
    year?: string;
    companionId?: string;
    tripId?: string;
  },
) {
  return expenses.filter((expense) => {
    if (query.year && expense.spentAt.getUTCFullYear().toString() !== query.year) {
      return false;
    }
    if (query.companionId && expense.companionId !== query.companionId) {
      return false;
    }
    if (query.tripId && query.tripId !== 'unassigned' && expense.tripId !== query.tripId) {
      return false;
    }
    if (query.tripId === 'unassigned') {
      return false;
    }
    return true;
  });
}

function buildExpenseInsights(expenses: RawExpense[]): StatsExpenseInsightsDto {
  const topTripMap = new Map<string, { tripId: string; tripName: string; amountCents: number; itemCount: number }>();

  expenses.forEach((expense) => {
    const current = topTripMap.get(expense.tripId) ?? {
      tripId: expense.tripId,
      tripName: expense.trip.name,
      amountCents: 0,
      itemCount: 0,
    };
    current.amountCents += expense.amountCents;
    current.itemCount += 1;
    topTripMap.set(expense.tripId, current);
  });

  const summary = buildTripExpenseSummary(expenses);
  return {
    summary,
    trend: buildTripExpenseTrend(expenses),
    topCategories: summary.categoryBreakdown.slice(0, 5),
    topTrips: Array.from(topTripMap.values())
      .sort((left, right) => right.amountCents - left.amountCents)
      .slice(0, 5),
  };
}

function isDefaultStatsOverviewQuery(query: StatsOverviewQuery) {
  return (
    !query.year &&
    query.scope === 'all' &&
    !query.companionId &&
    !query.tripId &&
    !query.tag &&
    !query.mood &&
    !query.weather &&
    !query.transport &&
    !query.budgetLevel
  );
}

async function listAchievementUnlocks(prisma: Prisma.TransactionClient | ReturnType<typeof getPrismaClient>, accountId: string, periodKey: string) {
  return prisma.achievementUnlock.findMany({
    where: {
      accountId,
      periodKey,
    },
  });
}

async function persistAchievementUnlocks(
  prisma: Prisma.TransactionClient | ReturnType<typeof getPrismaClient>,
  accountId: string,
  periodKey: string,
  achievements: StatsOverviewModel['achievements'],
) {
  const unlocked = achievements.filter((achievement) => achievement.status === 'unlocked');
  await Promise.all(
    unlocked.map((achievement) =>
      prisma.achievementUnlock.upsert({
        where: {
          accountId_achievementId_periodKey: {
            accountId,
            achievementId: achievement.id,
            periodKey,
          },
        },
        create: {
          id: randomUUID(),
          accountId,
          achievementId: achievement.id,
          periodKey,
          evidenceJson: achievement.evidence as Prisma.InputJsonValue,
        },
        update: {},
      }),
    ),
  );
}

function applyAchievementUnlocks(
  achievements: StatsOverviewModel['achievements'],
  unlocks: Array<{ achievementId: string; unlockedAt: Date }>,
) {
  const unlockByAchievementId = new Map(unlocks.map((unlock) => [unlock.achievementId, unlock]));
  return achievements.map((achievement) => {
    const unlock = unlockByAchievementId.get(achievement.id);
    return unlock
      ? {
          ...achievement,
          firstUnlockedAt: toIsoString(unlock.unlockedAt),
        }
      : achievement;
  });
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
  const filteredExpenses = filterExpenses(source.tripExpenses ?? [], {
    year: query.year,
    companionId: query.companionId,
    tripId: query.tripId,
  });

  const tripDetails = buildTripDetails(filteredMarkers, source.trips);

  const achievements = buildAchievements(filteredMarkers, tripDetails);
  if (isDefaultStatsOverviewQuery(query)) {
    await Promise.all([
      persistAchievementUnlocks(
        prisma,
        account.id,
        'global',
        achievements.filter((achievement) => achievement.periodType === 'global'),
      ),
      persistAchievementUnlocks(
        prisma,
        account.id,
        'streak',
        achievements.filter((achievement) => achievement.periodType === 'streak'),
      ),
    ]);
  }
  const [globalAchievementUnlocks, streakAchievementUnlocks] = await Promise.all([
    listAchievementUnlocks(prisma, account.id, 'global'),
    listAchievementUnlocks(prisma, account.id, 'streak'),
  ]);

  const tagLabels = await getMarkerTagLabels(prisma, account.id);

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
    topTags: buildTopTags(filteredMarkers, tagLabels),
    topMoods: buildTopMoods(filteredMarkers),
    topWeather: buildTopWeather(filteredMarkers),
    topTransports: buildTopTransports(filteredMarkers),
    topBudgetLevels: buildTopBudgetLevels(filteredMarkers),
    tripHighlights: buildTripHighlights(tripDetails),
    achievements: applyAchievementUnlocks(achievements, [...globalAchievementUnlocks, ...streakAchievementUnlocks]),
    expenseInsights: buildExpenseInsights(filteredExpenses),
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
  const filteredExpenses = filterExpenses(source.tripExpenses ?? [], { year: query.year });
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
  const annualAchievements = buildAnnualAchievements(query.year, filteredMarkers);
  const annualPeriodKey = `annual:${query.year}`;
  await persistAchievementUnlocks(prisma, account.id, annualPeriodKey, annualAchievements);
  const annualAchievementUnlocks = await listAchievementUnlocks(prisma, account.id, annualPeriodKey);

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
    achievements: applyAchievementUnlocks(annualAchievements, annualAchievementUnlocks),
    expenseInsights: buildExpenseInsights(filteredExpenses),
    firstMarker: chronologicalMarkers[0] ? serializeAnnualMarker(chronologicalMarkers[0]) : undefined,
    lastMarker:
      chronologicalMarkers.length > 0
        ? serializeAnnualMarker(chronologicalMarkers[chronologicalMarkers.length - 1])
        : undefined,
    generatedAt: toIsoString(new Date()),
  } satisfies AnnualReviewResponseDto;
}
