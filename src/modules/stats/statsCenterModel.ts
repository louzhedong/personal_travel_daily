import type {
  StatsFiltersDto,
  StatsHeatmapItemDto,
  StatsOverviewResponseDto,
} from '../../lib/api/types';
import type {
  MarkerBudgetLevel,
  MarkerMood,
  MarkerTag,
  MarkerTransport,
  MarkerWeather,
} from '../../types';

export interface StatsUiFilters {
  year: string;
  scope: 'all' | 'domestic' | 'international';
  companionId: string;
  tripId: string;
  tag: MarkerTag | 'all';
  mood: MarkerMood | 'all';
  weather: MarkerWeather | 'all';
  transport: MarkerTransport | 'all';
  budgetLevel: MarkerBudgetLevel | 'all';
}

export function createDefaultStatsUiFilters(): StatsUiFilters {
  return {
    year: 'all',
    scope: 'all',
    companionId: 'all',
    tripId: 'all',
    tag: 'all',
    mood: 'all',
    weather: 'all',
    transport: 'all',
    budgetLevel: 'all',
  };
}

export function mapResponseFiltersToUi(filters: StatsFiltersDto): StatsUiFilters {
  return {
    year: filters.year ?? 'all',
    scope: filters.scope,
    companionId: filters.companionId ?? 'all',
    tripId: filters.tripId ?? 'all',
    tag: filters.tag ?? 'all',
    mood: filters.mood ?? 'all',
    weather: filters.weather ?? 'all',
    transport: filters.transport ?? 'all',
    budgetLevel: filters.budgetLevel ?? 'all',
  };
}

export function mapUiFiltersToQuery(filters: StatsUiFilters) {
  return {
    year: filters.year === 'all' ? undefined : filters.year,
    scope: filters.scope,
    companionId: filters.companionId === 'all' ? undefined : filters.companionId,
    tripId: filters.tripId === 'all' ? undefined : filters.tripId,
    tag: filters.tag === 'all' ? undefined : filters.tag,
    mood: filters.mood === 'all' ? undefined : filters.mood,
    weather: filters.weather === 'all' ? undefined : filters.weather,
    transport: filters.transport === 'all' ? undefined : filters.transport,
    budgetLevel: filters.budgetLevel === 'all' ? undefined : filters.budgetLevel,
  };
}

export function formatStatsDate(value: string) {
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatStatsDateRange(startAt: string, endAt: string) {
  return `${formatStatsDate(startAt)} - ${formatStatsDate(endAt)}`;
}

export function formatGeneratedAt(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getBarPercentage(value: number, maxValue: number) {
  if (maxValue <= 0) {
    return 0;
  }
  return Math.max(8, Math.round((value / maxValue) * 100));
}

export function getHeatmapTone(intensity: number) {
  if (intensity >= 5) {
    return 'level-5';
  }
  if (intensity === 4) {
    return 'level-4';
  }
  if (intensity === 3) {
    return 'level-3';
  }
  if (intensity === 2) {
    return 'level-2';
  }
  return 'level-1';
}

export function getHeatmapLabel(item: StatsHeatmapItemDto) {
  return `${item.scopeName} · ${item.markerCount} 次记录`;
}

export function getTopMetricValue(
  items: Array<Record<'markerCount', number> & Partial<Record<'travelDays', number>>>,
  field: 'markerCount' | 'travelDays',
) {
  return Math.max(...items.map((item) => item[field] ?? 0), 0);
}

export function buildStatsSummaryItems(data: StatsOverviewResponseDto) {
  return [
    { label: '总行程数', value: data.summary.totalTrips, description: '筛选条件下的行程数量' },
    { label: '旅行记录', value: data.summary.totalMarkers, description: '筛选条件下的全部记录' },
    { label: '旅行天数', value: data.summary.totalTravelDays, description: '按日期去重后的覆盖天数' },
    { label: '覆盖城市', value: data.summary.totalCities, description: '不同城市总数' },
    { label: '覆盖地区', value: data.summary.totalRegions, description: '国内省份与国际国家' },
    { label: '国际国家', value: data.summary.totalCountries, description: '国际记录覆盖国家数' },
    { label: '活跃旅伴', value: data.summary.activeCompanions, description: '筛选条件下有记录的旅伴' },
    { label: '最长行程', value: data.summary.longestTripDays ?? 0, description: '筛选条件下最长行程天数' },
  ];
}
