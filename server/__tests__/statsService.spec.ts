// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPrismaClientMock: vi.fn(),
  getStatsOverviewSourceMock: vi.fn(),
  achievementUnlockFindManyMock: vi.fn(),
  achievementUnlockUpsertMock: vi.fn(),
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

vi.mock('../appApi/repositories/statsRepository.js', () => ({
  getStatsOverviewSource: mocks.getStatsOverviewSourceMock,
}));

import { getAnnualReview, getStatsOverview } from '../appApi/services/statsService.js';

describe('statsService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.achievementUnlockFindManyMock.mockResolvedValue([]);
    mocks.achievementUnlockUpsertMock.mockResolvedValue({});
    mocks.getPrismaClientMock.mockReturnValue({
      achievementUnlock: {
        findMany: mocks.achievementUnlockFindManyMock,
        upsert: mocks.achievementUnlockUpsertMock,
      },
    });
  });

  it('aggregates filtered stats for the current account', async () => {
    mocks.getStatsOverviewSourceMock.mockResolvedValue({
      id: 'acct-1',
      companions: [
        {
          id: 'user-alice',
          name: '小悠',
          color: '#2563eb',
          sortOrder: 0,
          createdAt: new Date('2026-05-01T00:00:00.000Z'),
        },
      ],
      trips: [
        {
          id: 'trip-1',
          accountId: 'acct-1',
          name: '江南春游',
          note: '杭州与苏州周末行',
          coverImageUrl: null,
          startsAt: new Date('2026-05-01T00:00:00.000Z'),
          endsAt: new Date('2026-05-03T00:00:00.000Z'),
          createdAt: new Date('2026-04-20T00:00:00.000Z'),
          updatedAt: new Date('2026-04-20T00:00:00.000Z'),
          isDeleted: false,
        },
      ],
      markers: [
        {
          id: 'marker-1',
          accountId: 'acct-1',
          companionId: 'user-alice',
          tripId: 'trip-1',
          scope: 'domestic',
          scopeId: 'zj',
          scopeName: '浙江',
          city: '杭州',
          note: '西湖晚风',
          visitedStartAt: new Date('2026-05-01T00:00:00.000Z'),
          visitedEndAt: new Date('2026-05-02T00:00:00.000Z'),
          createdAt: new Date('2026-05-03T00:00:00.000Z'),
          updatedAt: new Date('2026-05-03T00:00:00.000Z'),
          isDeleted: false,
          tags: ['citywalk', 'photography'],
          mood: 'relaxed',
          weather: 'sunny',
          transport: 'walk',
          budgetLevel: 'medium',
          images: [],
        },
        {
          id: 'marker-2',
          accountId: 'acct-1',
          companionId: 'user-alice',
          tripId: 'trip-1',
          scope: 'domestic',
          scopeId: 'zj',
          scopeName: '浙江',
          city: '杭州',
          note: '灵隐寺',
          visitedStartAt: new Date('2026-05-03T00:00:00.000Z'),
          visitedEndAt: new Date('2026-05-03T00:00:00.000Z'),
          createdAt: new Date('2026-05-03T00:00:00.000Z'),
          updatedAt: new Date('2026-05-03T00:00:00.000Z'),
          isDeleted: false,
          tags: ['food'],
          mood: 'excited',
          weather: 'cloudy',
          transport: 'train',
          budgetLevel: 'high',
          images: [],
        },
      ],
    });

    const result = await getStatsOverview(
      {
        id: 'acct-1',
        name: 'Voyage Atlas',
        username: 'demo',
        role: 'member',
      },
      {
        scope: 'domestic',
        year: '2026',
      },
    );

    expect(result.summary.totalTrips).toBe(1);
    expect(result.summary.totalMarkers).toBe(2);
    expect(result.summary.totalTravelDays).toBe(3);
    expect(result.availableYears).toEqual(['2026']);
    expect(result.topRegions[0]).toMatchObject({
      scopeId: 'zj',
      markerCount: 2,
    });
    expect(result.topTags).toContainEqual({
      value: 'citywalk',
      label: '城市漫游',
      markerCount: 1,
    });
    expect(result.topWeather).toContainEqual({
      value: 'cloudy',
      label: '多云',
      markerCount: 1,
    });
    expect(result.topTransports).toContainEqual({
      value: 'train',
      label: '火车',
      markerCount: 1,
    });
    expect(result.topBudgetLevels).toContainEqual({
      value: 'high',
      label: '高预算',
      markerCount: 1,
    });
    expect(result.achievements).toHaveLength(12);
    expect(result.achievements[0]).toMatchObject({
      id: 'city-explorer',
      title: '城市探索者',
      status: 'locked',
      progressValue: 1,
      progressTarget: 5,
    });
    expect(result.heatmap[0]?.intensity).toBe(5);
  });

  it('calculates achievement progress from the filtered stats source', async () => {
    const makeGuide = (id: string) => ({
      id,
      markerId: 'marker-1',
      guideIdentity: id,
      keyword: '旅行',
      guideTitle: `攻略 ${id}`,
      guideSummary: '摘要',
      guideSourceName: '示例来源',
      guideSourceUrl: `https://example.com/${id}`,
      savedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const makeImage = (index: number) => ({
      id: `image-${index}`,
      markerId: 'marker-1',
      imageUrl: `https://example.com/${index}.jpg`,
      sortOrder: index,
    });
    const baseMarker = {
      accountId: 'acct-1',
      tripId: 'trip-1',
      note: '',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      isDeleted: false,
      mood: null,
      weather: null,
      budgetLevel: null,
      images: [],
      savedGuides: [],
    };

    mocks.getStatsOverviewSourceMock.mockResolvedValue({
      id: 'acct-1',
      companions: [
        { id: 'user-alice', name: '小悠', color: '#2563eb', sortOrder: 0, createdAt: new Date('2026-01-01T00:00:00.000Z') },
        { id: 'user-bob', name: '阿川', color: '#14b8a6', sortOrder: 1, createdAt: new Date('2026-01-01T00:00:00.000Z') },
      ],
      trips: [
        {
          id: 'trip-1',
          accountId: 'acct-1',
          name: '三月远行',
          note: '',
          coverImageUrl: null,
          startsAt: new Date('2026-01-01T00:00:00.000Z'),
          endsAt: new Date('2026-03-01T00:00:00.000Z'),
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          isDeleted: false,
        },
      ],
      markers: [
        {
          ...baseMarker,
          id: 'marker-1',
          companionId: 'user-alice',
          scope: 'international',
          scopeId: 'jp-tokyo',
          scopeName: '东京',
          city: '东京',
          tags: ['citywalk'],
          transport: 'train',
          visitedStartAt: new Date('2026-01-01T00:00:00.000Z'),
          visitedEndAt: new Date('2026-01-05T00:00:00.000Z'),
          images: Array.from({ length: 20 }, (_, index) => makeImage(index)),
          savedGuides: ['guide-1', 'guide-2', 'guide-3', 'guide-4', 'guide-5'].map(makeGuide),
        },
        {
          ...baseMarker,
          id: 'marker-2',
          companionId: 'user-bob',
          scope: 'international',
          scopeId: 'kr-seoul',
          scopeName: '首尔',
          city: '首尔',
          tags: ['citywalk'],
          transport: 'plane',
          visitedStartAt: new Date('2026-02-01T00:00:00.000Z'),
          visitedEndAt: new Date('2026-02-01T00:00:00.000Z'),
        },
        {
          ...baseMarker,
          id: 'marker-3',
          companionId: 'user-alice',
          scope: 'international',
          scopeId: 'fr-paris',
          scopeName: '巴黎',
          city: '巴黎',
          tags: ['citywalk'],
          transport: 'train',
          visitedStartAt: new Date('2026-03-01T00:00:00.000Z'),
          visitedEndAt: new Date('2026-03-01T00:00:00.000Z'),
        },
        {
          ...baseMarker,
          id: 'marker-4',
          companionId: 'user-alice',
          scope: 'domestic',
          scopeId: 'zj',
          scopeName: '浙江',
          city: '杭州',
          tags: [],
          transport: 'walk',
          visitedStartAt: new Date('2026-03-02T00:00:00.000Z'),
          visitedEndAt: new Date('2026-03-02T00:00:00.000Z'),
        },
        {
          ...baseMarker,
          id: 'marker-5',
          companionId: 'user-alice',
          scope: 'domestic',
          scopeId: 'js',
          scopeName: '江苏',
          city: '苏州',
          tags: [],
          transport: 'walk',
          visitedStartAt: new Date('2026-03-03T00:00:00.000Z'),
          visitedEndAt: new Date('2026-03-03T00:00:00.000Z'),
        },
      ],
    });

    const result = await getStatsOverview(
      { id: 'acct-1', name: 'Voyage Atlas', username: 'demo', role: 'member' },
      { scope: 'all', year: '2026' },
    );

    const achievements = Object.fromEntries(result.achievements.map((item) => [item.id, item]));
    expect(achievements['city-explorer']).toMatchObject({ status: 'unlocked', progressValue: 5 });
    expect(achievements['country-collector']).toMatchObject({ status: 'unlocked', progressValue: 3 });
    expect(achievements['monthly-streak']).toMatchObject({ status: 'unlocked', progressValue: 3 });
    expect(achievements['guide-planner']).toMatchObject({ status: 'unlocked', progressValue: 5 });
    expect(achievements['photo-keeper']).toMatchObject({ status: 'unlocked', progressValue: 20 });
    expect(achievements['frequent-departure']).toMatchObject({ status: 'locked', progressValue: 9 });
  });

  it('applies metadata filters and keeps metadata rankings in sync', async () => {
    mocks.getStatsOverviewSourceMock.mockResolvedValue({
      id: 'acct-1',
      companions: [
        {
          id: 'user-alice',
          name: '小悠',
          color: '#2563eb',
          sortOrder: 0,
          createdAt: new Date('2026-05-01T00:00:00.000Z'),
        },
      ],
      trips: [],
      markers: [
        {
          id: 'marker-1',
          accountId: 'acct-1',
          companionId: 'user-alice',
          tripId: null,
          scope: 'domestic',
          scopeId: 'zj',
          scopeName: '浙江',
          city: '杭州',
          note: '西湖 citywalk',
          visitedStartAt: new Date('2026-05-01T00:00:00.000Z'),
          visitedEndAt: new Date('2026-05-01T00:00:00.000Z'),
          createdAt: new Date('2026-05-01T00:00:00.000Z'),
          updatedAt: new Date('2026-05-01T00:00:00.000Z'),
          isDeleted: false,
          tags: ['citywalk', 'food'],
          mood: 'relaxed',
          weather: 'sunny',
          transport: 'walk',
          budgetLevel: 'medium',
          images: [],
        },
        {
          id: 'marker-2',
          accountId: 'acct-1',
          companionId: 'user-alice',
          tripId: null,
          scope: 'domestic',
          scopeId: 'js',
          scopeName: '江苏',
          city: '苏州',
          note: '园林',
          visitedStartAt: new Date('2026-05-02T00:00:00.000Z'),
          visitedEndAt: new Date('2026-05-02T00:00:00.000Z'),
          createdAt: new Date('2026-05-02T00:00:00.000Z'),
          updatedAt: new Date('2026-05-02T00:00:00.000Z'),
          isDeleted: false,
          tags: ['museum'],
          mood: 'peaceful',
          weather: 'cloudy',
          transport: 'train',
          budgetLevel: 'high',
          images: [],
        },
      ],
    });

    const result = await getStatsOverview(
      {
        id: 'acct-1',
        name: 'Voyage Atlas',
        username: 'demo',
        role: 'member',
      },
      {
        scope: 'domestic',
        year: '2026',
        tag: 'citywalk',
        mood: 'relaxed',
        weather: 'sunny',
        transport: 'walk',
        budgetLevel: 'medium',
      },
    );

    expect(result.filters).toMatchObject({
      tag: 'citywalk',
      mood: 'relaxed',
      weather: 'sunny',
      transport: 'walk',
      budgetLevel: 'medium',
    });
    expect(result.summary.totalMarkers).toBe(1);
    expect(result.topTags).toEqual([
      { value: 'citywalk', label: '城市漫游', markerCount: 1 },
      { value: 'food', label: '美食', markerCount: 1 },
    ]);
    expect(result.topMoods).toEqual([{ value: 'relaxed', label: '放松', markerCount: 1 }]);
    expect(result.topWeather).toEqual([{ value: 'sunny', label: '晴', markerCount: 1 }]);
    expect(result.topTransports).toEqual([{ value: 'walk', label: '步行', markerCount: 1 }]);
    expect(result.topBudgetLevels).toEqual([{ value: 'medium', label: '中预算', markerCount: 1 }]);
  });

  it('aggregates international heatmap by country for map rendering', async () => {
    mocks.getStatsOverviewSourceMock.mockResolvedValue({
      id: 'acct-1',
      companions: [
        {
          id: 'user-alice',
          name: '小悠',
          color: '#2563eb',
          sortOrder: 0,
          createdAt: new Date('2026-05-01T00:00:00.000Z'),
        },
      ],
      trips: [],
      markers: [
        {
          id: 'marker-1',
          accountId: 'acct-1',
          companionId: 'user-alice',
          tripId: null,
          scope: 'international',
          scopeId: 'jp-kyoto',
          scopeName: '京都府',
          city: '京都',
          note: '',
          visitedStartAt: new Date('2026-04-01T00:00:00.000Z'),
          visitedEndAt: new Date('2026-04-01T00:00:00.000Z'),
          createdAt: new Date('2026-04-01T00:00:00.000Z'),
          updatedAt: new Date('2026-04-01T00:00:00.000Z'),
          isDeleted: false,
          images: [],
        },
        {
          id: 'marker-2',
          accountId: 'acct-1',
          companionId: 'user-alice',
          tripId: null,
          scope: 'international',
          scopeId: 'jp-osaka',
          scopeName: '大阪府',
          city: '大阪',
          note: '',
          visitedStartAt: new Date('2026-04-03T00:00:00.000Z'),
          visitedEndAt: new Date('2026-04-03T00:00:00.000Z'),
          createdAt: new Date('2026-04-03T00:00:00.000Z'),
          updatedAt: new Date('2026-04-03T00:00:00.000Z'),
          isDeleted: false,
          images: [],
        },
        {
          id: 'marker-3',
          accountId: 'acct-1',
          companionId: 'user-alice',
          tripId: null,
          scope: 'international',
          scopeId: 'hk',
          scopeName: '香港',
          city: '香港',
          note: '',
          visitedStartAt: new Date('2026-04-04T00:00:00.000Z'),
          visitedEndAt: new Date('2026-04-04T00:00:00.000Z'),
          createdAt: new Date('2026-04-04T00:00:00.000Z'),
          updatedAt: new Date('2026-04-04T00:00:00.000Z'),
          isDeleted: false,
          images: [],
        },
      ],
    });

    const result = await getStatsOverview(
      {
        id: 'acct-1',
        name: 'Voyage Atlas',
        username: 'demo',
        role: 'member',
      },
      {
        scope: 'international',
      },
    );

    expect(result.summary.totalCountries).toBe(2);
    expect(result.topRegions).toEqual([
      { scopeId: 'jp', scopeName: '日本', scope: 'international', markerCount: 2 },
      { scopeId: 'cn', scopeName: '中国', scope: 'international', markerCount: 1 },
    ]);
    expect(result.heatmap).toHaveLength(2);
  });

  it('aggregates an annual review for the requested year', async () => {
    mocks.getStatsOverviewSourceMock.mockResolvedValue({
      id: 'acct-1',
      companions: [
        {
          id: 'user-alice',
          name: '小悠',
          color: '#2563eb',
          sortOrder: 0,
          createdAt: new Date('2026-05-01T00:00:00.000Z'),
        },
      ],
      trips: [
        {
          id: 'trip-1',
          accountId: 'acct-1',
          name: '江南春游',
          note: '杭州和苏州',
          coverImageUrl: null,
          startsAt: new Date('2026-05-01T00:00:00.000Z'),
          endsAt: new Date('2026-05-04T00:00:00.000Z'),
          createdAt: new Date('2026-04-20T00:00:00.000Z'),
          updatedAt: new Date('2026-04-20T00:00:00.000Z'),
          isDeleted: false,
        },
      ],
      markers: [
        {
          id: 'marker-1',
          accountId: 'acct-1',
          companionId: 'user-alice',
          companion: { id: 'user-alice', name: '小悠', color: '#2563eb' },
          tripId: 'trip-1',
          scope: 'domestic',
          scopeId: 'zj',
          scopeName: '浙江',
          city: '杭州',
          note: '西湖晚风',
          visitedStartAt: new Date('2026-05-01T00:00:00.000Z'),
          visitedEndAt: new Date('2026-05-02T00:00:00.000Z'),
          createdAt: new Date('2026-05-03T00:00:00.000Z'),
          updatedAt: new Date('2026-05-03T00:00:00.000Z'),
          isDeleted: false,
          images: [{ id: 'image-1', markerId: 'marker-1', imageUrl: 'https://example.com/photo.jpg', sortOrder: 0 }],
          savedGuides: [
            {
              id: 'guide-1',
              markerId: 'marker-1',
              guideIdentity: 'guide-identity-1',
              keyword: '杭州',
              guideTitle: '杭州周末攻略',
              guideSummary: '适合春天出发。',
              guideSourceName: '示例来源',
              guideSourceUrl: 'https://example.com/guide',
              savedAt: new Date('2026-05-01T00:00:00.000Z'),
            },
          ],
        },
        {
          id: 'marker-2',
          accountId: 'acct-1',
          companionId: 'user-alice',
          companion: { id: 'user-alice', name: '小悠', color: '#2563eb' },
          tripId: 'trip-1',
          scope: 'domestic',
          scopeId: 'zj',
          scopeName: '浙江',
          city: '苏州',
          note: '园林',
          visitedStartAt: new Date('2026-05-04T00:00:00.000Z'),
          visitedEndAt: new Date('2026-05-04T00:00:00.000Z'),
          createdAt: new Date('2026-05-04T00:00:00.000Z'),
          updatedAt: new Date('2026-05-04T00:00:00.000Z'),
          isDeleted: false,
          images: [],
          savedGuides: [],
        },
        {
          id: 'marker-old',
          accountId: 'acct-1',
          companionId: 'user-alice',
          companion: { id: 'user-alice', name: '小悠', color: '#2563eb' },
          tripId: null,
          scope: 'domestic',
          scopeId: 'bj',
          scopeName: '北京',
          city: '北京',
          note: '',
          visitedStartAt: new Date('2025-05-04T00:00:00.000Z'),
          visitedEndAt: new Date('2025-05-04T00:00:00.000Z'),
          createdAt: new Date('2025-05-04T00:00:00.000Z'),
          updatedAt: new Date('2025-05-04T00:00:00.000Z'),
          isDeleted: false,
          images: [],
          savedGuides: [],
        },
      ],
    });

    const result = await getAnnualReview(
      {
        id: 'acct-1',
        name: 'Voyage Atlas',
        username: 'demo',
        role: 'member',
      },
      { year: '2026' },
    );

    expect(result.year).toBe('2026');
    expect(result.availableYears).toEqual(['2026', '2025']);
    expect(result.summary.totalMarkers).toBe(2);
    expect(result.summary.photoCount).toBe(1);
    expect(result.summary.guideCount).toBe(1);
    expect(result.representativePhoto?.imageUrl).toBe('https://example.com/photo.jpg');
    expect(result.guides[0]?.title).toBe('杭州周末攻略');
    expect(result.firstMarker?.city).toBe('杭州');
    expect(result.lastMarker?.city).toBe('苏州');
  });

  it('returns an empty annual review payload when the year has no markers', async () => {
    mocks.getStatsOverviewSourceMock.mockResolvedValue({
      id: 'acct-1',
      companions: [],
      trips: [],
      markers: [
        {
          id: 'marker-old',
          accountId: 'acct-1',
          companionId: 'user-alice',
          companion: { id: 'user-alice', name: '小悠', color: '#2563eb' },
          tripId: null,
          scope: 'domestic',
          scopeId: 'bj',
          scopeName: '北京',
          city: '北京',
          note: '',
          visitedStartAt: new Date('2025-05-04T00:00:00.000Z'),
          visitedEndAt: new Date('2025-05-04T00:00:00.000Z'),
          createdAt: new Date('2025-05-04T00:00:00.000Z'),
          updatedAt: new Date('2025-05-04T00:00:00.000Z'),
          isDeleted: false,
          images: [],
          savedGuides: [],
        },
      ],
    });

    const result = await getAnnualReview(
      {
        id: 'acct-1',
        name: 'Voyage Atlas',
        username: 'demo',
        role: 'member',
      },
      { year: '2026' },
    );

    expect(result.summary.totalMarkers).toBe(0);
    expect(result.availableYears).toEqual(['2025']);
    expect(result.photos).toEqual([]);
    expect(result.firstMarker).toBeUndefined();
  });
});
