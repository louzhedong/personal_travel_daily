import type { StatsOverviewModel } from '../../../serializers/statsSerializer.js';
import { normalizeMarkerTags, normalizeMarkerTransport } from '../../../serializers/bootstrap/markers.js';
import { countTravelDays, getYear, toDateOnlyString } from './dates.js';
import { buildAggregatedRegions } from './rankings.js';
import type { RawMarker } from './types.js';

type AchievementItem = StatsOverviewModel['achievements'][number];
type AchievementEvidence = NonNullable<StatsOverviewModel['achievements'][number]['evidence']>;
type AchievementCategory = AchievementItem['category'];
type AchievementGroup = AchievementItem['group'];
type AchievementPeriodType = AchievementItem['periodType'];
type AchievementRarity = AchievementItem['rarity'];

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
