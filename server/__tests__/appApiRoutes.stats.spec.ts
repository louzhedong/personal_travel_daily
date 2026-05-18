// @vitest-environment node

import { expect, it } from 'vitest';
import { currentAccount, describeAppApiRoutesDomain, mocks } from './appApiRoutes.setup.js';
import { buildApp } from '../appApi/buildApp.js';

describeAppApiRoutesDomain('stats and atlas', () => {
  it('returns stats overview payload for authenticated accounts', async () => {
    mocks.getStatsOverviewMock.mockResolvedValue({
      filters: {
        year: 'all',
        scope: 'all',
        tag: 'citywalk',
        mood: 'relaxed',
        weather: 'sunny',
        transport: 'walk',
        budgetLevel: 'medium',
      },
      availableYears: ['2026'],
      companions: [{ id: 'user-alice', name: '小悠', color: '#2563eb' }],
      trips: [],
      summary: {
        totalTrips: 1,
        totalMarkers: 2,
        totalTravelDays: 4,
        totalCities: 2,
        totalRegions: 2,
        totalCountries: 0,
        activeCompanions: 1,
        longestTripDays: 4,
      },
      yearlySeries: [{ year: '2026', markerCount: 2, travelDays: 4 }],
      monthlyDistribution: [{ month: '05', markerCount: 2, travelDays: 4 }],
      topRegions: [{ scopeId: 'zj', scopeName: '浙江', scope: 'domestic', markerCount: 2 }],
      topCities: [{ city: '杭州', scopeName: '浙江', scope: 'domestic', markerCount: 2 }],
      companionRanking: [
        {
          companionId: 'user-alice',
          companionName: '小悠',
          color: '#2563eb',
          markerCount: 2,
          travelDays: 4,
        },
      ],
      tripRanking: [],
      tripDetails: [],
      topTags: [{ value: 'citywalk', label: '城市漫游', markerCount: 2 }],
      topMoods: [{ value: 'relaxed', label: '放松', markerCount: 2 }],
      topWeather: [{ value: 'sunny', label: '晴', markerCount: 2 }],
      topTransports: [{ value: 'walk', label: '步行', markerCount: 2 }],
      topBudgetLevels: [{ value: 'medium', label: '中预算', markerCount: 2 }],
      tripHighlights: {},
      achievements: [
        {
          id: 'city-explorer',
          title: '城市探索者',
          description: '覆盖 5 座不同城市。',
          category: 'footprint',
          group: 'footprint',
          periodType: 'global',
          rarity: 'common',
          status: 'close',
          progressValue: 3,
          progressTarget: 5,
          unit: '座城市',
          nextHint: '还差 2 座城市，再多解锁几座新城市。',
        },
      ],
      heatmap: [{ scopeId: 'zj', scopeName: '浙江', scope: 'domestic', intensity: 5, markerCount: 2 }],
      generatedAt: '2026-04-22T00:00:00.000Z',
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/overview?scope=domestic&year=2026&tag=citywalk&mood=relaxed&weather=sunny&transport=walk&budgetLevel=medium',
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.getStatsOverviewMock).toHaveBeenCalledWith(currentAccount, {
        scope: 'domestic',
        year: '2026',
        tag: 'citywalk',
        mood: 'relaxed',
        weather: 'sunny',
        transport: 'walk',
        budgetLevel: 'medium',
      });
      expect(response.json().summary.totalMarkers).toBe(2);
      expect(response.json().topTags[0]).toEqual({
        value: 'citywalk',
        label: '城市漫游',
        markerCount: 2,
      });
      expect(response.json().achievements[0]).toMatchObject({
        id: 'city-explorer',
        status: 'close',
      });
    } finally {
      await app.close();
    }
  });

  it('returns annual review payload for authenticated accounts', async () => {
    mocks.getAnnualReviewMock.mockResolvedValue({
      year: '2026',
      availableYears: ['2026'],
      summary: {
        totalTrips: 1,
        totalMarkers: 2,
        totalTravelDays: 4,
        totalCities: 2,
        totalRegions: 2,
        totalCountries: 0,
        activeCompanions: 1,
        longestTripDays: 4,
        photoCount: 1,
        guideCount: 1,
      },
      monthlyDistribution: [],
      topRegions: [],
      topCities: [],
      companionRanking: [],
      tripHighlights: {},
      heatmap: [],
      photos: [],
      guides: [],
      trips: [],
      achievements: [
        {
          id: 'annual-2026-travel-days',
          title: '年度出发王',
          description: '这一年旅行天数达到 20 天。',
          category: 'rhythm',
          group: 'annual',
          periodType: 'annual',
          rarity: 'rare',
          status: 'locked',
          progressValue: 4,
          progressTarget: 20,
          unit: '天',
          nextHint: '还差 16 天，继续累积更多出发日。',
        },
      ],
      generatedAt: '2026-04-22T00:00:00.000Z',
    });

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stats/annual-review?year=2026',
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.getAnnualReviewMock).toHaveBeenCalledWith(currentAccount, {
        year: '2026',
      });
      expect(response.json().year).toBe('2026');
    } finally {
      await app.close();
    }
  });

  it('returns atlas timeline payload for authenticated accounts', async () => {
    const atlasResponse = {
      filters: { year: '2026', month: '03', scope: 'domestic' },
      availableYears: ['2026'],
      companions: [{ id: 'user-alice', name: 'Alice', color: '#0f172a' }],
      trips: [{ id: 'trip-1', name: '江南春游', startsAt: '2026-03-01', endsAt: '2026-03-03' }],
      summary: {
        markerCount: 1,
        travelDays: 1,
        cityCount: 1,
        regionCount: 1,
        countryCount: 0,
        photoCount: 1,
        companionCount: 1,
        tripCount: 1,
        firstVisitedAt: '2026-03-01',
        latestVisitedAt: '2026-03-01',
      },
      replay: [],
      placeIndex: { regions: [] },
      compare: { years: [], companions: [], scopes: [] },
      exportModel: {
        posterTitle: '旅行地图时间机器',
        posterSubtitle: '2026 · 1 段旅行记录 · 1 座城市',
        routeTitle: '等待第一段旅行轨迹',
        indexTitle: '1 座城市索引',
      },
      generatedAt: '2026-05-12T00:00:00.000Z',
    };
    mocks.getAtlasTimelineMock.mockResolvedValue(atlasResponse);

    const app = await buildApp();
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/atlas/timeline?year=2026&month=03&scope=domestic',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(atlasResponse);
      expect(mocks.getAtlasTimelineMock).toHaveBeenCalledWith(currentAccount, {
        year: '2026',
        month: '03',
        scope: 'domestic',
      });
    } finally {
      await app.close();
    }
  });
});
