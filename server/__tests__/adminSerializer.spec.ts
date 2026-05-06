// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  buildAdminAccountStatsMock: vi.fn(),
}));

vi.mock('../appApi/services/admin/accountStats.js', () => ({
  buildAdminAccountStats: mocks.buildAdminAccountStatsMock,
}));

import { serializeAdminOverview } from '../appApi/serializers/adminSerializer.js';

describe('adminSerializer', () => {
  beforeEach(() => {
    mocks.buildAdminAccountStatsMock.mockReset();
    mocks.buildAdminAccountStatsMock.mockReturnValue({
      tripCount: 1,
      companionCount: 1,
      markerCount: 1,
      savedGuideCount: 2,
      guideSearchHistoryCount: 1,
      planningItemCount: 1,
      convertedPlanningItemCount: 0,
      markerSearchEventCount: 1,
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-06T10:00:00.000Z'));
  });

  it('serializes account nodes, nested relations, and stats inputs', () => {
    const result = serializeAdminOverview([
      {
        id: 'acct-1',
        name: 'Voyage Atlas',
        username: 'demo',
        role: 'admin',
        passwordHash: 'hashed',
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
        updatedAt: new Date('2026-04-01T00:00:00.000Z'),
        deletedAt: null,
        isDeleted: false,
        trips: [
          {
            id: 'trip-1',
            accountId: 'acct-1',
            name: '京都春游',
            coverImageUrl: null,
            note: '一路散步',
            startsAt: new Date('2026-04-02T00:00:00.000Z'),
            endsAt: new Date('2026-04-05T00:00:00.000Z'),
            createdAt: new Date('2026-03-01T00:00:00.000Z'),
            updatedAt: new Date('2026-03-01T00:00:00.000Z'),
            deletedAt: null,
            isDeleted: false,
          },
        ],
        companions: [
          {
            id: 'user-1',
            accountId: 'acct-1',
            name: '小悠',
            color: '#2563eb',
            sortOrder: 0,
            createdAt: new Date('2026-03-01T00:00:00.000Z'),
            updatedAt: new Date('2026-03-01T00:00:00.000Z'),
            deletedAt: null,
            isDeleted: false,
            markers: [
              {
                id: 'marker-1',
                accountId: 'acct-1',
                companionId: 'user-1',
                tripId: 'trip-1',
                scope: 'domestic',
                scopeId: 'zj',
                scopeName: '浙江',
                city: '杭州',
                note: '西湖',
                tags: [],
                mood: null,
                weather: null,
                transport: null,
                budgetLevel: null,
                visitedStartAt: new Date('2026-04-02T00:00:00.000Z'),
                visitedEndAt: new Date('2026-04-02T00:00:00.000Z'),
                createdAt: new Date('2026-04-02T08:00:00.000Z'),
                updatedAt: new Date('2026-04-02T08:00:00.000Z'),
                deletedAt: null,
                isDeleted: false,
                images: [
                  {
                    id: 'img-1',
                    markerId: 'marker-1',
                    imageUrl: 'https://example.com/lake.jpg',
                    sortOrder: 0,
                    createdAt: new Date('2026-04-02T08:00:00.000Z'),
                  },
                ],
              },
            ],
            guides: [
              {
                id: 'guide-1',
                accountId: 'acct-1',
                savedByCompanionId: 'user-1',
                markerId: 'marker-1',
                saveContextKey: 'spring-trip',
                keyword: '京都 春游',
                guideIdentity: 'guide-search',
                guideTitle: '京都散步地图',
                guideSummary: '寺院与小路',
                guideSourceName: 'Qyer',
                guideSourceUrl: 'https://example.com/guide-search',
                guideCoverImageUrl: null,
                guideAuthorName: null,
                guidePublishedAt: null,
                guideDestinationLabel: '京都',
                guidePayloadJson: {
                  id: 'guide-search',
                  title: '京都散步地图',
                  summary: '寺院与小路',
                  sourceName: 'Qyer',
                  sourceUrl: 'https://example.com/guide-search',
                },
                savedAt: new Date('2026-04-03T00:00:00.000Z'),
                deletedAt: null,
                isDeleted: false,
              },
              {
                id: 'guide-2',
                accountId: 'acct-1',
                savedByCompanionId: 'user-1',
                markerId: null,
                saveContextKey: 'spring-trip',
                keyword: '杭州 周末',
                guideIdentity: 'guide-fallback',
                guideTitle: '杭州周末攻略',
                guideSummary: '西湖和灵隐寺',
                guideSourceName: 'Example',
                guideSourceUrl: 'https://example.com/fallback',
                guideCoverImageUrl: null,
                guideAuthorName: '作者甲',
                guidePublishedAt: new Date('2026-03-20T00:00:00.000Z'),
                guideDestinationLabel: '杭州',
                guidePayloadJson: { invalid: true },
                savedAt: new Date('2026-04-04T00:00:00.000Z'),
                deletedAt: null,
                isDeleted: false,
              },
            ],
            histories: [
              {
                id: 'history-1',
                accountId: 'acct-1',
                companionId: 'user-1',
                keyword: '京都 春游',
                scope: 'international',
                createdAt: new Date('2026-04-03T00:00:00.000Z'),
                updatedAt: new Date('2026-04-03T00:00:00.000Z'),
                deletedAt: null,
                isDeleted: false,
              },
            ],
            tripPlanningItems: [
              {
                id: 'planning-1',
                accountId: 'acct-1',
                tripId: 'trip-1',
                createdByCompanionId: 'user-1',
                title: '岚山竹林',
                scope: 'international',
                scopeId: 'japan',
                scopeName: '日本',
                city: '京都',
                note: '清晨去',
                priority: 'high',
                plannedDate: new Date('2026-04-04T00:00:00.000Z'),
                status: 'planned',
                convertedMarkerId: null,
                sourceGuideIdentity: 'guide-search',
                sourceGuideTitle: '京都散步地图',
                sourceGuideSourceName: 'Qyer',
                sourceGuideSourceUrl: 'https://example.com/guide-search',
                sortOrder: 0,
                createdAt: new Date('2026-04-01T00:00:00.000Z'),
                updatedAt: new Date('2026-04-01T00:00:00.000Z'),
                deletedAt: null,
                isDeleted: false,
                trip: {
                  id: 'trip-1',
                  accountId: 'acct-1',
                  name: '京都春游',
                  coverImageUrl: null,
                  note: '一路散步',
                  startsAt: new Date('2026-04-02T00:00:00.000Z'),
                  endsAt: new Date('2026-04-05T00:00:00.000Z'),
                  createdAt: new Date('2026-03-01T00:00:00.000Z'),
                  updatedAt: new Date('2026-03-01T00:00:00.000Z'),
                  deletedAt: null,
                  isDeleted: false,
                },
              },
            ],
          },
        ],
        markerSearchEvents: [
          {
            id: 'event-1',
            accountId: 'acct-1',
            companionId: 'user-1',
            keyword: '樱花',
            scope: 'international',
            year: 2026,
            resultCount: 12,
            page: 1,
            pageSize: 10,
            createdAt: new Date('2026-04-05T00:00:00.000Z'),
          },
        ],
      } as never,
    ]);

    expect(mocks.buildAdminAccountStatsMock).toHaveBeenCalledWith({
      tripCount: 1,
      companions: expect.any(Array),
      markerSearchEventCount: 1,
    });
    expect(result.meta).toEqual({
      fetchedAt: '2026-04-06T10:00:00.000Z',
      accountCount: 1,
    });
    expect(result.accounts[0]).toMatchObject({
      id: 'acct-1',
      name: 'Voyage Atlas',
      username: 'demo',
      role: 'admin',
      createdAt: '2026-04-01T00:00:00.000Z',
      stats: {
        tripCount: 1,
        companionCount: 1,
        markerCount: 1,
        savedGuideCount: 2,
        guideSearchHistoryCount: 1,
        planningItemCount: 1,
        convertedPlanningItemCount: 0,
        markerSearchEventCount: 1,
      },
      trips: [
        {
          id: 'trip-1',
          name: '京都春游',
          startsAt: '2026-04-02',
          endsAt: '2026-04-05',
        },
      ],
      companions: [
        {
          id: 'user-1',
          name: '小悠',
          color: '#2563eb',
          markers: [
            {
              id: 'marker-1',
              tripId: 'trip-1',
              scope: 'domestic',
              city: '杭州',
              imageUrls: ['https://example.com/lake.jpg'],
              visitedStartAt: '2026-04-02',
            },
          ],
          savedGuides: [
            {
              id: 'guide-1',
              keyword: '京都 春游',
              result: {
                id: 'guide-search',
                title: '京都散步地图',
              },
            },
            {
              id: 'guide-2',
              keyword: '杭州 周末',
              result: {
                id: 'guide-2',
                title: '杭州周末攻略',
                summary: '西湖和灵隐寺',
                sourceName: 'Example',
                sourceUrl: 'https://example.com/fallback',
                authorName: '作者甲',
                publishedAt: '2026-03-20T00:00:00.000Z',
                destinationLabel: '杭州',
              },
            },
          ],
          guideSearchHistory: [
            {
              id: 'history-1',
              keyword: '京都 春游',
              scope: 'international',
            },
          ],
          planningItems: [
            {
              id: 'planning-1',
              tripId: 'trip-1',
              tripName: '京都春游',
              companionId: 'user-1',
              companionName: '小悠',
              title: '岚山竹林',
              priority: 'high',
              plannedDate: '2026-04-04',
              status: 'planned',
              sourceGuideTitle: '京都散步地图',
            },
          ],
        },
      ],
      markerSearchEvents: [
        {
          id: 'event-1',
          companionId: 'user-1',
          keyword: '樱花',
          scope: 'international',
          year: 2026,
          resultCount: 12,
          page: 1,
          pageSize: 10,
          createdAt: '2026-04-05T00:00:00.000Z',
        },
      ],
    });
  });

  it('serializes an empty overview list', () => {
    expect(serializeAdminOverview([])).toEqual({
      accounts: [],
      guideSearchTrends: [],
      guideSearchStatusBreakdown: [],
      guideSourceHealth: [],
      meta: {
        fetchedAt: '2026-04-06T10:00:00.000Z',
        accountCount: 0,
      },
    });
  });
});
