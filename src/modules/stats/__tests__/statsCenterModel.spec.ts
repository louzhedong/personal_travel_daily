import { describe, expect, it, vi } from 'vitest';
import {
  buildStatsSummaryItems,
  createDefaultStatsUiFilters,
  formatGeneratedAt,
  formatStatsDate,
  formatStatsDateRange,
  getBarPercentage,
  getHeatmapLabel,
  getHeatmapTone,
  getTopMetricValue,
  mapResponseFiltersToUi,
  mapUiFiltersToQuery,
} from '../statsCenterModel';

describe('statsCenterModel', () => {
  it('creates default filters and maps api filters both ways', () => {
    const defaults = createDefaultStatsUiFilters();
    expect(defaults).toEqual({
      year: 'all',
      scope: 'all',
      companionId: 'all',
      tripId: 'all',
      tag: 'all',
      mood: 'all',
      weather: 'all',
      transport: 'all',
      budgetLevel: 'all',
    });

    const ui = mapResponseFiltersToUi({
      year: '2026',
      scope: 'domestic',
      companionId: 'u1',
      tripId: 'trip-1',
      tag: 'food',
      mood: 'relaxed',
      weather: 'sunny',
      transport: 'walk',
      budgetLevel: 'medium',
    });
    expect(ui).toEqual({
      year: '2026',
      scope: 'domestic',
      companionId: 'u1',
      tripId: 'trip-1',
      tag: 'food',
      mood: 'relaxed',
      weather: 'sunny',
      transport: 'walk',
      budgetLevel: 'medium',
    });
    expect(mapUiFiltersToQuery(defaults)).toEqual({
      year: undefined,
      scope: 'all',
      companionId: undefined,
      tripId: undefined,
      tag: undefined,
      mood: undefined,
      weather: undefined,
      transport: undefined,
      budgetLevel: undefined,
    });
  });

  it('formats dates and generatedAt strings using zh-CN locale', () => {
    const dateSpy = vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('2026/04/01');
    const dateTimeSpy = vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('2026/04/01 08:30');

    expect(formatStatsDate('2026-04-01T00:00:00.000Z')).toBe('2026/04/01');
    expect(formatStatsDateRange('2026-04-01T00:00:00.000Z', '2026-04-03T00:00:00.000Z')).toBe(
      '2026/04/01 - 2026/04/01',
    );
    expect(formatGeneratedAt('2026-04-01T08:30:00.000Z')).toBe('2026/04/01 08:30');

    dateSpy.mockRestore();
    dateTimeSpy.mockRestore();
  });

  it('computes chart helper values and summary cards', () => {
    expect(getBarPercentage(0, 0)).toBe(0);
    expect(getBarPercentage(1, 20)).toBe(8);
    expect(getBarPercentage(10, 20)).toBe(50);
    expect(getHeatmapTone(5)).toBe('level-5');
    expect(getHeatmapTone(4)).toBe('level-4');
    expect(getHeatmapTone(3)).toBe('level-3');
    expect(getHeatmapTone(2)).toBe('level-2');
    expect(getHeatmapTone(1)).toBe('level-1');
    expect(getHeatmapLabel({ scopeName: '浙江', markerCount: 3 } as never)).toBe('浙江 · 3 次记录');
    expect(getTopMetricValue([{ markerCount: 4 }, { markerCount: 7 }], 'markerCount')).toBe(7);
    expect(getTopMetricValue([{ markerCount: 4, travelDays: 2 }, { markerCount: 7, travelDays: 8 }], 'travelDays')).toBe(8);

    expect(
      buildStatsSummaryItems({
        summary: {
          totalTrips: 2,
          totalMarkers: 12,
          totalTravelDays: 8,
          totalCities: 5,
          totalRegions: 4,
          totalCountries: 2,
          activeCompanions: 3,
          longestTripDays: 6,
        },
      } as never),
    ).toEqual([
      { label: '总行程数', value: 2, description: '筛选条件下的行程数量' },
      { label: '旅行记录', value: 12, description: '筛选条件下的全部记录' },
      { label: '旅行天数', value: 8, description: '按日期去重后的覆盖天数' },
      { label: '覆盖城市', value: 5, description: '不同城市总数' },
      { label: '覆盖地区', value: 4, description: '国内省份与国际国家' },
      { label: '国际国家', value: 2, description: '国际记录覆盖国家数' },
      { label: '活跃旅伴', value: 3, description: '筛选条件下有记录的旅伴' },
      { label: '最长行程', value: 6, description: '筛选条件下最长行程天数' },
    ]);
  });
});
