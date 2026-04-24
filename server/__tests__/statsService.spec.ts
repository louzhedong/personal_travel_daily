// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPrismaClientMock: vi.fn(),
  getStatsOverviewSourceMock: vi.fn(),
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

vi.mock('../appApi/repositories/statsRepository.js', () => ({
  getStatsOverviewSource: mocks.getStatsOverviewSourceMock,
}));

import { getStatsOverview } from '../appApi/services/statsService.js';

describe('statsService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getPrismaClientMock.mockReturnValue({});
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
    expect(result.heatmap[0]?.intensity).toBe(5);
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
});
