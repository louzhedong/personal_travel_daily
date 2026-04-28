// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPrismaClientMock: vi.fn(),
  findTripDetailSourceMock: vi.fn(),
  listActiveTripChecklistItemsByTripIdMock: vi.fn(),
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

vi.mock('../appApi/repositories/tripDetailRepository.js', () => ({
  findTripDetailSource: mocks.findTripDetailSourceMock,
}));

vi.mock('../appApi/repositories/tripChecklistRepository.js', () => ({
  listActiveTripChecklistItemsByTripId: mocks.listActiveTripChecklistItemsByTripIdMock,
}));

import { getTripDetail } from '../appApi/services/tripDetailService.js';

describe('tripDetailService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getPrismaClientMock.mockReturnValue({});
    mocks.listActiveTripChecklistItemsByTripIdMock.mockResolvedValue([
      {
        id: 'item-1',
        accountId: 'acct-1',
        tripId: 'trip-1',
        createdByCompanionId: 'user-alice',
        title: '提前确认景点预约',
        note: '尽量避开中午高峰',
        stage: 'pre_departure',
        sortOrder: 0,
        origin: 'generated',
        sourceGuideIdentity: 'guide-shared',
        sourceGuideTitle: '杭州周末攻略',
        sourceGuideSourceName: 'Qyer',
        sourceGuideSourceUrl: 'https://example.com/guide',
        sourceSnippet: '建议提前预约',
        isDeleted: false,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-01T00:00:00.000Z'),
        deletedAt: null,
        createdByCompanion: {
          id: 'user-alice',
          accountId: 'acct-1',
          name: '小悠',
          color: '#2563eb',
          sortOrder: 0,
          createdAt: new Date('2026-04-20T00:00:00.000Z'),
          updatedAt: new Date('2026-04-20T00:00:00.000Z'),
          deletedAt: null,
          isDeleted: false,
        },
      },
    ]);
  });

  it('aggregates a trip detail payload with summary, photos and deduplicated guides', async () => {
    mocks.findTripDetailSourceMock.mockResolvedValue({
      id: 'trip-1',
      accountId: 'acct-1',
      name: '江南春游',
      coverImageUrl: null,
      note: '杭州与苏州周末行',
      startsAt: new Date('2026-05-01T00:00:00.000Z'),
      endsAt: new Date('2026-05-03T00:00:00.000Z'),
      createdAt: new Date('2026-04-20T00:00:00.000Z'),
      updatedAt: new Date('2026-04-20T00:00:00.000Z'),
      deletedAt: null,
      isDeleted: false,
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
          createdAt: new Date('2026-05-02T00:00:00.000Z'),
          updatedAt: new Date('2026-05-02T00:00:00.000Z'),
          deletedAt: null,
          isDeleted: false,
          companion: {
            id: 'user-alice',
            accountId: 'acct-1',
            name: '小悠',
            color: '#2563eb',
            sortOrder: 0,
            createdAt: new Date('2026-04-20T00:00:00.000Z'),
            updatedAt: new Date('2026-04-20T00:00:00.000Z'),
            deletedAt: null,
            isDeleted: false,
          },
          images: [
            {
              id: 'img-1',
              markerId: 'marker-1',
              imageUrl: 'https://example.com/hangzhou-1.jpg',
              sortOrder: 0,
              createdAt: new Date('2026-05-02T00:00:00.000Z'),
            },
            {
              id: 'img-2',
              markerId: 'marker-1',
              imageUrl: 'https://example.com/hangzhou-2.jpg',
              sortOrder: 1,
              createdAt: new Date('2026-05-02T00:00:00.000Z'),
            },
          ],
          savedGuides: [
            {
              id: 'guide-1',
              accountId: 'acct-1',
              savedByCompanionId: 'user-alice',
              markerId: 'marker-1',
              saveContextKey: 'jiangnan',
              keyword: '杭州周末',
              guideIdentity: 'guide-shared',
              guideTitle: '杭州周末攻略',
              guideSummary: '逛西湖、灵隐寺',
              guideSourceName: 'Qyer',
              guideSourceUrl: 'https://example.com/guide',
              guideCoverImageUrl: null,
              guideAuthorName: null,
              guidePublishedAt: null,
              guideDestinationLabel: '杭州',
              guidePayloadJson: {
                id: 'guide-shared',
                title: '杭州周末攻略',
                summary: '逛西湖、灵隐寺',
                sourceName: 'Qyer',
                sourceUrl: 'https://example.com/guide',
              },
              savedAt: new Date('2026-05-04T00:00:00.000Z'),
              deletedAt: null,
              isDeleted: false,
            },
          ],
        },
        {
          id: 'marker-2',
          accountId: 'acct-1',
          companionId: 'user-alice',
          tripId: 'trip-1',
          scope: 'domestic',
          scopeId: 'js',
          scopeName: '江苏',
          city: '苏州',
          note: '平江路夜游',
          visitedStartAt: new Date('2026-05-03T00:00:00.000Z'),
          visitedEndAt: new Date('2026-05-03T00:00:00.000Z'),
          createdAt: new Date('2026-05-03T00:00:00.000Z'),
          updatedAt: new Date('2026-05-03T00:00:00.000Z'),
          deletedAt: null,
          isDeleted: false,
          companion: {
            id: 'user-alice',
            accountId: 'acct-1',
            name: '小悠',
            color: '#2563eb',
            sortOrder: 0,
            createdAt: new Date('2026-04-20T00:00:00.000Z'),
            updatedAt: new Date('2026-04-20T00:00:00.000Z'),
            deletedAt: null,
            isDeleted: false,
          },
          images: [],
          savedGuides: [
            {
              id: 'guide-2',
              accountId: 'acct-1',
              savedByCompanionId: 'user-alice',
              markerId: 'marker-2',
              saveContextKey: 'jiangnan',
              keyword: '苏州慢游',
              guideIdentity: 'guide-shared',
              guideTitle: '杭州周末攻略',
              guideSummary: '逛西湖、灵隐寺',
              guideSourceName: 'Qyer',
              guideSourceUrl: 'https://example.com/guide',
              guideCoverImageUrl: null,
              guideAuthorName: null,
              guidePublishedAt: null,
              guideDestinationLabel: '杭州',
              guidePayloadJson: {
                id: 'guide-shared',
                title: '杭州周末攻略',
                summary: '逛西湖、灵隐寺',
                sourceName: 'Qyer',
                sourceUrl: 'https://example.com/guide',
              },
              savedAt: new Date('2026-05-05T00:00:00.000Z'),
              deletedAt: null,
              isDeleted: false,
            },
          ],
        },
      ],
    });

    const result = await getTripDetail('acct-1', 'trip-1');

    expect(result.trip.name).toBe('江南春游');
    expect(result.summary).toEqual({
      markerCount: 2,
      travelDays: 3,
      cityCount: 2,
      regionCount: 2,
      companionCount: 1,
      guideCount: 1,
      photoCount: 2,
    });
    expect(result.companions).toEqual([{ id: 'user-alice', name: '小悠', color: '#2563eb', markerCount: 2 }]);
    expect(result.photos.map((item) => item.imageUrl)).toEqual([
      'https://example.com/hangzhou-1.jpg',
      'https://example.com/hangzhou-2.jpg',
    ]);
    expect(result.guides).toHaveLength(1);
    expect(result.guides[0]).toMatchObject({
      id: 'guide-2',
      keyword: '苏州慢游',
    });
    expect(result.markers[0]).toMatchObject({
      id: 'marker-1',
      companionName: '小悠',
      city: '杭州',
      imageUrls: ['https://example.com/hangzhou-1.jpg', 'https://example.com/hangzhou-2.jpg'],
    });
    expect(result.checklistSummary.total).toBe(1);
    expect(result.checklistGroups[0].title).toBe('出发前准备');
  });
});
