// stats 域纯聚合函数 / Pure aggregation helpers for the stats domain.
// 不依赖 Prisma / I/O；仅基于 RawStatsSource 衍生类型进行无副作用的聚合与排序。
// Prisma / I/O free; performs pure, side-effect-free aggregation and ranking over RawStatsSource
// derived types.
import type { TravelScope } from '@prisma/client';
import {
  MARKER_BUDGET_LEVELS,
  MARKER_MOODS,
  MARKER_TAGS,
  MARKER_TRANSPORTS,
  MARKER_WEATHERS,
} from '../../../../../shared/markerMetadata.js';
import { INTERNATIONAL_COUNTRY_BY_SCOPE_PREFIX } from '../countryMapping.js';
import type { StatsOverviewModel } from '../../../serializers/statsSerializer.js';
import type { AnnualReviewResponseDto } from '../../../types.js';
import type { getStatsOverviewSource } from '../../../repositories/statsRepository.js';
import {
  normalizeMarkerBudgetLevel,
  normalizeMarkerMood,
  normalizeMarkerTags,
  normalizeMarkerTransport,
  normalizeMarkerWeather,
} from '../../../serializers/bootstrap/markers.js';

type RawStatsSource = NonNullable<Awaited<ReturnType<typeof getStatsOverviewSource>>>;
export type RawCompanion = RawStatsSource['companions'][number];
export type RawTrip = RawStatsSource['trips'][number];
export type RawMarker = RawStatsSource['markers'][number];

export type AggregatedRegion = {
  scopeId: string;
  scopeName: string;
  scope: TravelScope;
  markerCount: number;
};

type AchievementItem = StatsOverviewModel['achievements'][number];
type AchievementEvidence = NonNullable<StatsOverviewModel['achievements'][number]['evidence']>;
type AchievementCategory = AchievementItem['category'];
type AchievementGroup = AchievementItem['group'];
type AchievementPeriodType = AchievementItem['periodType'];
type AchievementRarity = AchievementItem['rarity'];

export function toDateOnlyString(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function getYear(value: Date) {
  return value.toISOString().slice(0, 4);
}

export function getMonth(value: Date) {
  return value.toISOString().slice(5, 7);
}

export function enumerateDateKeys(startAt: Date, endAt: Date) {
  const start = new Date(Date.UTC(startAt.getUTCFullYear(), startAt.getUTCMonth(), startAt.getUTCDate()));
  const end = new Date(Date.UTC(endAt.getUTCFullYear(), endAt.getUTCMonth(), endAt.getUTCDate()));
  const keys: string[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    keys.push(cursor.toISOString().slice(0, 10));
  }
  return keys;
}

export function countTravelDays(markers: RawMarker[]) {
  const uniqueDays = new Set<string>();
  markers.forEach((marker) => {
    enumerateDateKeys(marker.visitedStartAt, marker.visitedEndAt).forEach((day) => uniqueDays.add(day));
  });
  return uniqueDays.size;
}

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

export function buildTopTags(markers: RawMarker[]) {
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
  return buildMetadataRanking(
    counts,
    Object.fromEntries(
      MARKER_TAGS.map((tag) => [
        tag,
        {
          food: '美食',
          hiking: '徒步',
          beach: '海边',
          museum: '博物馆',
          photography: '摄影',
          family: '亲子',
          weekend: '周末',
          business: '出差',
          nature: '自然风景',
          citywalk: '城市漫游',
        }[tag],
      ]),
    ),
  );
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

function getAchievementRarity(
  id: string,
  periodType: AchievementPeriodType,
  progressTarget: number,
): AchievementRarity {
  if (periodType === 'streak') {
    return id.endsWith('-3') ? 'legendary' : 'epic';
  }
  if (periodType === 'annual') {
    return 'rare';
  }
  if (id === 'long-trip' || id === 'country-collector') {
    return 'epic';
  }
  if (id === 'photo-keeper' || progressTarget <= 5) {
    return 'common';
  }
  return 'rare';
}

function getAchievementNextHint(input: {
  id: string;
  status: AchievementItem['status'];
  remainingValue: number;
  unit: string;
}): string | undefined {
  if (input.status === 'unlocked') {
    return undefined;
  }

  switch (input.id) {
    case 'city-explorer':
    case 'cross-city-traveler':
      return `还差 ${input.remainingValue} ${input.unit}，再多解锁几座新城市。`;
    case 'first-international-trip':
      return '补上 1 条国际记录，就能点亮第一次世界出发。';
    case 'country-collector':
    case 'annual-country-collector':
      return `还差 ${input.remainingValue} ${input.unit}，再补一些国际目的地。`;
    case 'long-trip':
    case 'annual-long-trip':
      return `还差 ${input.remainingValue} ${input.unit}，把下一趟行程拉长一点。`;
    case 'frequent-departure':
    case 'annual-travel-days':
      return `还差 ${input.remainingValue} ${input.unit}，继续累积更多出发日。`;
    case 'monthly-streak':
      return `还差 ${input.remainingValue} ${input.unit}，在新的月份留下记录就能推进连续脚步。`;
    case 'shared-memory':
    case 'annual-shared-memory':
      return `还差 ${input.remainingValue} ${input.unit}，和更多旅伴留下共同记忆。`;
    case 'guide-planner':
      return `还差 ${input.remainingValue} ${input.unit}，再收藏或关联一些攻略灵感。`;
    case 'photo-keeper':
    case 'annual-photo-keeper':
      return `还差 ${input.remainingValue} ${input.unit}，补几张代表瞬间就更接近了。`;
    case 'citywalk-lover':
    case 'annual-citywalk-lover':
      return `还差 ${input.remainingValue} ${input.unit}，再多走一段城市漫游。`;
    case 'rail-flight-traveler':
      return `还差 ${input.remainingValue} ${input.unit}，再记录几次火车或飞行出发。`;
    case 'streak-consecutive-years-2':
    case 'streak-consecutive-years-3':
      return `还差 ${input.remainingValue} 年连续记录，再让下一年也留下足迹。`;
    default:
      return `还差 ${input.remainingValue} ${input.unit}，继续记录就会更接近。`;
  }
}

function buildAchievement(input: {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  progressValue: number;
  progressTarget: number;
  unit: string;
  evidence?: AchievementEvidence;
  group?: AchievementGroup;
  periodType?: AchievementPeriodType;
  rarity?: AchievementRarity;
  streakYears?: string[];
  nextHint?: string;
}): AchievementItem {
  const status =
    input.progressValue >= input.progressTarget
      ? 'unlocked'
      : input.progressValue / input.progressTarget >= 0.6
        ? 'close'
        : 'locked';
  const remainingValue = Math.max(input.progressTarget - input.progressValue, 0);
  const periodType = input.periodType ?? 'global';
  const group = input.group ?? input.category;

  return {
    id: input.id,
    title: input.title,
    description: input.description,
    category: input.category,
    group,
    periodType,
    rarity: input.rarity ?? getAchievementRarity(input.id, periodType, input.progressTarget),
    status,
    progressValue: input.progressValue,
    progressTarget: input.progressTarget,
    remainingValue,
    unit: input.unit,
    evidence: input.evidence ?? [],
    streakYears: input.streakYears,
    nextHint:
      input.nextHint ??
      getAchievementNextHint({
        id: input.id,
        status,
        remainingValue,
        unit: input.unit,
      }),
  };
}

function limitEvidence(items: AchievementEvidence, limit = 5) {
  return items.slice(0, limit);
}

function countConsecutiveActiveMonths(markers: RawMarker[]) {
  const activeMonths = Array.from(
    new Set(markers.map((marker) => marker.visitedStartAt.toISOString().slice(0, 7))),
  ).sort();
  let longestStreak = 0;
  let currentStreak = 0;
  let previousMonthIndex: number | undefined;

  activeMonths.forEach((month) => {
    const [year, monthValue] = month.split('-').map(Number);
    const monthIndex = year * 12 + monthValue;
    currentStreak = previousMonthIndex === undefined || monthIndex === previousMonthIndex + 1 ? currentStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, currentStreak);
    previousMonthIndex = monthIndex;
  });

  return longestStreak;
}

function findLongestConsecutiveYearStreak(years: string[]) {
  const sortedYears = Array.from(new Set(years))
    .map(Number)
    .sort((left, right) => left - right);
  let best: number[] = [];
  let current: number[] = [];

  sortedYears.forEach((year) => {
    if (current.length === 0 || year === current[current.length - 1] + 1) {
      current.push(year);
    } else {
      if (current.length > best.length) {
        best = [...current];
      }
      current = [year];
    }
  });

  if (current.length > best.length) {
    best = [...current];
  }

  return best.map((year) => String(year));
}

function countUniqueGuides(markers: RawMarker[]) {
  const guides = new Set<string>();
  markers.forEach((marker) => {
    marker.savedGuides?.forEach((guide) => {
      guides.add(guide.id || guide.guideIdentity);
    });
  });
  return guides.size;
}

function buildCityEvidence(markers: RawMarker[]) {
  const cities = new Map<string, { label: string; value: string }>();
  markers.forEach((marker) => {
    const key = `${marker.scope}:${marker.scopeId}:${marker.city}`;
    cities.set(key, { label: marker.city, value: marker.scopeName });
  });
  return limitEvidence(Array.from(cities.values()));
}

function buildCompanionEvidence(markers: RawMarker[]) {
  const companions = new Map<string, { label: string; value: string }>();
  markers.forEach((marker) => {
    companions.set(marker.companionId, {
      label: marker.companion?.name ?? marker.companionId,
      value: marker.city,
    });
  });
  return limitEvidence(Array.from(companions.values()));
}

function buildGuideEvidence(markers: RawMarker[]) {
  const guides = new Map<string, { label: string; value: string }>();
  markers.forEach((marker) => {
    marker.savedGuides?.forEach((guide) => {
      guides.set(guide.id || guide.guideIdentity, {
        label: guide.guideTitle,
        value: guide.guideSourceName,
      });
    });
  });
  return limitEvidence(Array.from(guides.values()));
}

function buildPhotoEvidence(markers: RawMarker[]) {
  return limitEvidence(
    markers
      .filter((marker) => (marker.images?.length ?? 0) > 0)
      .map((marker) => ({
        label: `${marker.scopeName} · ${marker.city}`,
        value: `${marker.images?.length ?? 0} 张照片`,
      })),
  );
}

function buildMonthEvidence(markers: RawMarker[]) {
  const months = Array.from(new Set(markers.map((marker) => marker.visitedStartAt.toISOString().slice(0, 7)))).sort();
  return limitEvidence(months.map((month) => ({ label: month, value: '有旅行记录' })), 6);
}

function buildYearEvidence(years: string[]) {
  return limitEvidence(years.map((year) => ({ label: `${year} 年`, value: '有旅行记录' })), 6);
}

function buildAnnualTripSummaries(markers: RawMarker[]) {
  const grouped = new Map<string, RawMarker[]>();

  markers.forEach((marker) => {
    const key = marker.tripId ?? `marker:${marker.id}`;
    const current = grouped.get(key) ?? [];
    current.push(marker);
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .map((groupedMarkers) => {
      const sortedMarkers = [...groupedMarkers].sort(
        (left, right) => left.visitedStartAt.getTime() - right.visitedStartAt.getTime(),
      );
      const firstMarker = sortedMarkers[0];
      const lastMarker = sortedMarkers[sortedMarkers.length - 1];
      if (!firstMarker || !lastMarker) {
        return null;
      }
      return {
        title:
          groupedMarkers.length > 1
            ? `${firstMarker.scopeName} · ${firstMarker.city} 等 ${groupedMarkers.length} 条记录`
            : `${firstMarker.scopeName} · ${firstMarker.city}`,
        travelDays: countTravelDays(sortedMarkers),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((left, right) => right.travelDays - left.travelDays);
}

export function buildStreakAchievements(markers: RawMarker[]): StatsOverviewModel['achievements'] {
  const streakYears = findLongestConsecutiveYearStreak(markers.map((marker) => getYear(marker.visitedStartAt)));
  const streakLength = streakYears.length;
  const evidence = buildYearEvidence(streakYears);

  return [
    buildAchievement({
      id: 'streak-consecutive-years-2',
      title: '连续两年都在路上',
      description: '连续 2 年都有旅行记录。',
      category: 'rhythm',
      group: 'streak',
      periodType: 'streak',
      progressValue: streakLength,
      progressTarget: 2,
      unit: '年连续记录',
      evidence,
      streakYears,
    }),
    buildAchievement({
      id: 'streak-consecutive-years-3',
      title: '把旅行过成习惯',
      description: '连续 3 年都有旅行记录。',
      category: 'rhythm',
      group: 'streak',
      periodType: 'streak',
      progressValue: streakLength,
      progressTarget: 3,
      unit: '年连续记录',
      evidence,
      streakYears,
    }),
  ];
}

export function buildAchievements(
  markers: RawMarker[],
  tripDetails: StatsOverviewModel['tripDetails'],
): StatsOverviewModel['achievements'] {
  const totalCities = new Set(markers.map((marker) => `${marker.scope}:${marker.scopeId}:${marker.city}`)).size;
  const totalCountries = buildAggregatedRegions(markers).filter((item) => item.scope === 'international').length;
  const longestTripDays = tripDetails.length > 0 ? Math.max(...tripDetails.map((trip) => trip.travelDays)) : 0;
  const totalTravelDays = countTravelDays(markers);
  const activeCompanions = new Set(markers.map((marker) => marker.companionId)).size;
  const guideCount = countUniqueGuides(markers);
  const photoCount = markers.reduce((total, marker) => total + (marker.images?.length ?? 0), 0);
  const citywalkCount = markers.filter((marker) => normalizeMarkerTags(marker.tags)?.includes('citywalk') ?? false).length;
  const railOrFlightCount = markers.filter((marker) => {
    const transport = normalizeMarkerTransport(marker.transport);
    return transport === 'train' || transport === 'plane';
  }).length;

  return [
    buildAchievement({
      id: 'city-explorer',
      title: '城市探索者',
      description: '覆盖 5 座不同城市。',
      category: 'footprint',
      progressValue: totalCities,
      progressTarget: 5,
      unit: '座城市',
      evidence: buildCityEvidence(markers),
    }),
    buildAchievement({
      id: 'cross-city-traveler',
      title: '跨城旅人',
      description: '覆盖 10 座不同城市。',
      category: 'footprint',
      progressValue: totalCities,
      progressTarget: 10,
      unit: '座城市',
      evidence: buildCityEvidence(markers),
    }),
    buildAchievement({
      id: 'first-international-trip',
      title: '世界初体验',
      description: '留下至少 1 条国际旅行记录。',
      category: 'footprint',
      progressValue: markers.some((marker) => marker.scope === 'international') ? 1 : 0,
      progressTarget: 1,
      unit: '条国际记录',
      evidence: limitEvidence(
        markers
          .filter((marker) => marker.scope === 'international')
          .map((marker) => ({ label: `${marker.scopeName} · ${marker.city}`, value: toDateOnlyString(marker.visitedStartAt) })),
        3,
      ),
    }),
    buildAchievement({
      id: 'country-collector',
      title: '国家收藏家',
      description: '覆盖 3 个国际国家或地区。',
      category: 'footprint',
      progressValue: totalCountries,
      progressTarget: 3,
      unit: '个国家/地区',
      evidence: limitEvidence(
        buildAggregatedRegions(markers)
          .filter((item) => item.scope === 'international')
          .map((item) => ({ label: item.scopeName, value: `${item.markerCount} 条记录` })),
      ),
    }),
    buildAchievement({
      id: 'long-trip',
      title: '长线旅行者',
      description: '最长行程达到 5 天。',
      category: 'rhythm',
      progressValue: longestTripDays,
      progressTarget: 5,
      unit: '天',
      evidence: limitEvidence(tripDetails.map((trip) => ({ label: trip.tripName, value: `${trip.travelDays} 天` }))),
    }),
    buildAchievement({
      id: 'frequent-departure',
      title: '高频出发',
      description: '累计旅行天数达到 30 天。',
      category: 'rhythm',
      progressValue: totalTravelDays,
      progressTarget: 30,
      unit: '天',
      evidence: buildMonthEvidence(markers),
    }),
    buildAchievement({
      id: 'monthly-streak',
      title: '连续脚步',
      description: '连续 3 个月有旅行记录。',
      category: 'rhythm',
      progressValue: countConsecutiveActiveMonths(markers),
      progressTarget: 3,
      unit: '个月',
      evidence: buildMonthEvidence(markers),
    }),
    buildAchievement({
      id: 'shared-memory',
      title: '同行记忆',
      description: '与 2 位以上旅伴留下记录。',
      category: 'companion',
      progressValue: activeCompanions,
      progressTarget: 2,
      unit: '位旅伴',
      evidence: buildCompanionEvidence(markers),
    }),
    buildAchievement({
      id: 'guide-planner',
      title: '攻略派',
      description: '关联或收藏攻略达到 5 篇。',
      category: 'content',
      progressValue: guideCount,
      progressTarget: 5,
      unit: '篇攻略',
      evidence: buildGuideEvidence(markers),
    }),
    buildAchievement({
      id: 'photo-keeper',
      title: '摄影记录者',
      description: '旅行照片达到 20 张。',
      category: 'content',
      progressValue: photoCount,
      progressTarget: 20,
      unit: '张照片',
      evidence: buildPhotoEvidence(markers),
    }),
    buildAchievement({
      id: 'citywalk-lover',
      title: '城市漫游家',
      description: '城市漫游标签达到 3 条。',
      category: 'style',
      progressValue: citywalkCount,
      progressTarget: 3,
      unit: '条记录',
      evidence: limitEvidence(
        markers
          .filter((marker) => normalizeMarkerTags(marker.tags)?.includes('citywalk') ?? false)
          .map((marker) => ({ label: `${marker.scopeName} · ${marker.city}`, value: toDateOnlyString(marker.visitedStartAt) })),
      ),
    }),
    buildAchievement({
      id: 'rail-flight-traveler',
      title: '铁道/飞行偏好',
      description: '火车或飞机交通记录达到 3 条。',
      category: 'style',
      progressValue: railOrFlightCount,
      progressTarget: 3,
      unit: '条记录',
      evidence: limitEvidence(
        markers
          .filter((marker) => {
            const transport = normalizeMarkerTransport(marker.transport);
            return transport === 'train' || transport === 'plane';
          })
          .map((marker) => ({ label: `${marker.scopeName} · ${marker.city}`, value: normalizeMarkerTransport(marker.transport) === 'train' ? '火车' : '飞机' })),
      ),
    }),
    ...buildStreakAchievements(markers),
  ];
}

export function buildAnnualAchievements(
  year: string,
  markers: RawMarker[],
): StatsOverviewModel['achievements'] {
  const travelDays = countTravelDays(markers);
  const photoCount = markers.reduce((total, marker) => total + (marker.images?.length ?? 0), 0);
  const activeCompanions = new Set(markers.map((marker) => marker.companionId)).size;
  const totalCountries = buildAggregatedRegions(markers).filter((item) => item.scope === 'international').length;
  const annualTripSummaries = buildAnnualTripSummaries(markers);
  const longestTripDays = annualTripSummaries.length > 0 ? annualTripSummaries[0].travelDays : 0;
  const citywalkCount = markers.filter((marker) => normalizeMarkerTags(marker.tags)?.includes('citywalk') ?? false).length;

  return [
    buildAchievement({
      id: `annual-${year}-travel-days`,
      title: '年度出发王',
      description: '这一年旅行天数达到 20 天。',
      category: 'rhythm',
      group: 'annual',
      periodType: 'annual',
      progressValue: travelDays,
      progressTarget: 20,
      unit: '天',
      evidence: buildMonthEvidence(markers),
      nextHint: getAchievementNextHint({
        id: 'annual-travel-days',
        status: travelDays >= 20 ? 'unlocked' : travelDays / 20 >= 0.6 ? 'close' : 'locked',
        remainingValue: Math.max(20 - travelDays, 0),
        unit: '天',
      }),
    }),
    buildAchievement({
      id: `annual-${year}-photo-keeper`,
      title: '年度摄影手',
      description: '这一年旅行照片达到 30 张。',
      category: 'content',
      group: 'annual',
      periodType: 'annual',
      progressValue: photoCount,
      progressTarget: 30,
      unit: '张照片',
      evidence: buildPhotoEvidence(markers),
      nextHint: getAchievementNextHint({
        id: 'annual-photo-keeper',
        status: photoCount >= 30 ? 'unlocked' : photoCount / 30 >= 0.6 ? 'close' : 'locked',
        remainingValue: Math.max(30 - photoCount, 0),
        unit: '张照片',
      }),
    }),
    buildAchievement({
      id: `annual-${year}-shared-memory`,
      title: '年度同行记忆',
      description: '这一年与 2 位以上旅伴同行。',
      category: 'companion',
      group: 'annual',
      periodType: 'annual',
      progressValue: activeCompanions,
      progressTarget: 2,
      unit: '位旅伴',
      evidence: buildCompanionEvidence(markers),
      nextHint: getAchievementNextHint({
        id: 'annual-shared-memory',
        status: activeCompanions >= 2 ? 'unlocked' : activeCompanions / 2 >= 0.6 ? 'close' : 'locked',
        remainingValue: Math.max(2 - activeCompanions, 0),
        unit: '位旅伴',
      }),
    }),
    buildAchievement({
      id: `annual-${year}-country-collector`,
      title: '年度国家收集',
      description: '这一年覆盖 2 个国际国家或地区。',
      category: 'footprint',
      group: 'annual',
      periodType: 'annual',
      progressValue: totalCountries,
      progressTarget: 2,
      unit: '个国家/地区',
      evidence: limitEvidence(
        buildAggregatedRegions(markers)
          .filter((item) => item.scope === 'international')
          .map((item) => ({ label: item.scopeName, value: `${item.markerCount} 条记录` })),
      ),
      nextHint: getAchievementNextHint({
        id: 'annual-country-collector',
        status: totalCountries >= 2 ? 'unlocked' : totalCountries / 2 >= 0.6 ? 'close' : 'locked',
        remainingValue: Math.max(2 - totalCountries, 0),
        unit: '个国家/地区',
      }),
    }),
    buildAchievement({
      id: `annual-${year}-long-trip`,
      title: '年度长线旅人',
      description: '这一年最长行程达到 5 天。',
      category: 'rhythm',
      group: 'annual',
      periodType: 'annual',
      progressValue: longestTripDays,
      progressTarget: 5,
      unit: '天',
      evidence: limitEvidence(annualTripSummaries.map((trip) => ({ label: trip.title, value: `${trip.travelDays} 天` }))),
      nextHint: getAchievementNextHint({
        id: 'annual-long-trip',
        status: longestTripDays >= 5 ? 'unlocked' : longestTripDays / 5 >= 0.6 ? 'close' : 'locked',
        remainingValue: Math.max(5 - longestTripDays, 0),
        unit: '天',
      }),
    }),
    buildAchievement({
      id: `annual-${year}-citywalk-lover`,
      title: '年度城市漫游家',
      description: '这一年城市漫游标签达到 3 条。',
      category: 'style',
      group: 'annual',
      periodType: 'annual',
      progressValue: citywalkCount,
      progressTarget: 3,
      unit: '条记录',
      evidence: limitEvidence(
        markers
          .filter((marker) => normalizeMarkerTags(marker.tags)?.includes('citywalk') ?? false)
          .map((marker) => ({ label: `${marker.scopeName} · ${marker.city}`, value: toDateOnlyString(marker.visitedStartAt) })),
      ),
      nextHint: getAchievementNextHint({
        id: 'annual-citywalk-lover',
        status: citywalkCount >= 3 ? 'unlocked' : citywalkCount / 3 >= 0.6 ? 'close' : 'locked',
        remainingValue: Math.max(3 - citywalkCount, 0),
        unit: '条记录',
      }),
    }),
  ];
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

export function toIsoString(value: Date) {
  return value.toISOString();
}

export function buildPhotos(markers: RawMarker[]): AnnualReviewResponseDto['photos'] {
  return markers
    .flatMap((marker) =>
      marker.images.map((image) => ({
        imageId: image.id,
        markerId: marker.id,
        markerTitle: `${marker.scopeName} 路 ${marker.city}`,
        imageUrl: image.imageUrl,
        visitedStartAt: toDateOnlyString(marker.visitedStartAt),
        scopeName: marker.scopeName,
        city: marker.city,
        isFeatured: image.isFeatured,
        caption: image.caption ?? undefined,
        curatedSortOrder: image.curatedSortOrder ?? undefined,
        originalSortOrder: image.sortOrder,
      })),
    )
    .sort((left, right) => {
      if (left.isFeatured !== right.isFeatured) {
        return left.isFeatured ? -1 : 1;
      }
      const leftCurated = left.curatedSortOrder ?? Number.MAX_SAFE_INTEGER;
      const rightCurated = right.curatedSortOrder ?? Number.MAX_SAFE_INTEGER;
      if (leftCurated !== rightCurated) {
        return leftCurated - rightCurated;
      }
      const dateCompare = left.visitedStartAt.localeCompare(right.visitedStartAt);
      if (dateCompare !== 0) {
        return dateCompare;
      }
      return left.originalSortOrder - right.originalSortOrder;
    })
    .map(({ originalSortOrder, ...photo }) => photo);
}

export function buildAnnualGuides(markers: RawMarker[]): AnnualReviewResponseDto['guides'] {
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

export function serializeAnnualMarker(marker: RawMarker): AnnualReviewResponseDto['firstMarker'] {
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

export function buildAnnualTripHighlights(
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

export function buildAvailableYears(markers: RawMarker[]) {
  return Array.from(new Set(markers.map((marker) => getYear(marker.visitedStartAt)))).sort((left, right) =>
    right.localeCompare(left),
  );
}
