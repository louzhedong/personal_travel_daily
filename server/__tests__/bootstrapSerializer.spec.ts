// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  serializeBootstrapResponse,
  serializeBootstrapStore,
} from '../appApi/serializers/bootstrap/store.js';

describe('bootstrapSerializer', () => {
  it('serializes the bootstrap store into DTO shape', () => {
    const store = serializeBootstrapStore({
      users: [
        {
          id: 'user-1',
          name: '小悠',
          color: '#2563eb',
        } as never,
      ],
      trips: [
        {
          id: 'trip-1',
          name: '京都春游',
          coverImageUrl: null,
          note: '一路散步看樱花',
          startsAt: new Date('2026-04-01T00:00:00.000Z'),
          endsAt: new Date('2026-04-05T00:00:00.000Z'),
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
        } as never,
      ],
      markers: [
        {
          id: 'marker-1',
          companionId: 'user-1',
          tripId: 'trip-1',
          scope: 'domestic',
          scopeId: 'zj',
          scopeName: '浙江省',
          city: '杭州',
          note: '西湖边散步',
          tags: ['food', 'invalid'],
          mood: 'relaxed',
          weather: 'sunny',
          transport: 'walk',
          budgetLevel: 'medium',
          visitedStartAt: new Date('2026-04-02T00:00:00.000Z'),
          visitedEndAt: new Date('2026-04-02T00:00:00.000Z'),
          createdAt: new Date('2026-04-02T08:00:00.000Z'),
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
      wishlistItems: [],
      activeUserId: 'user-1',
      savedGuides: [
        {
          id: 'guide-1',
          markerId: 'marker-1',
          savedByCompanionId: 'user-1',
          keyword: '杭州周末',
          guideIdentity: 'guide-identity',
          guideTitle: '杭州周末攻略',
          guideSummary: '西湖和灵隐寺',
          guideSourceName: 'Qyer',
          guideSourceUrl: 'https://example.com/guide',
          guideCoverImageUrl: null,
          guideAuthorName: null,
          guidePublishedAt: null,
          guideDestinationLabel: '杭州',
          guidePayloadJson: {
            id: 'guide-identity',
            title: '杭州周末攻略',
            summary: '西湖和灵隐寺',
            sourceName: 'Qyer',
            sourceUrl: 'https://example.com/guide',
          },
          savedAt: new Date('2026-04-03T00:00:00.000Z'),
        } as never,
      ],
      guideSearchHistory: [
        {
          id: 'history-1',
          keyword: '杭州周末',
          scope: 'domestic',
          createdAt: new Date('2026-04-01T00:00:00.000Z'),
        } as never,
      ],
    });

    expect(store).toEqual({
      users: [{ id: 'user-1', name: '小悠', color: '#2563eb' }],
      trips: [
        {
          id: 'trip-1',
          name: '京都春游',
          note: '一路散步看樱花',
          startsAt: '2026-04-01',
          endsAt: '2026-04-05',
          createdAt: '2026-03-01T00:00:00.000Z',
        },
      ],
      markers: [
        {
          id: 'marker-1',
          userId: 'user-1',
          tripId: 'trip-1',
          scope: 'domestic',
          scopeId: 'zj',
          scopeName: '浙江省',
          city: '杭州',
          note: '西湖边散步',
          tags: ['food'],
          mood: 'relaxed',
          weather: 'sunny',
          transport: 'walk',
          budgetLevel: 'medium',
          imageUrls: ['https://example.com/lake.jpg'],
          visitedStartAt: '2026-04-02',
          visitedEndAt: '2026-04-02',
          createdAt: '2026-04-02T08:00:00.000Z',
        },
      ],
      wishlistItems: [],
      activeUserId: 'user-1',
      savedGuides: [
        {
          id: 'guide-1',
          markerId: 'marker-1',
          savedByUserId: 'user-1',
          keyword: '杭州周末',
          result: {
            id: 'guide-identity',
            title: '杭州周末攻略',
            summary: '西湖和灵隐寺',
            sourceName: 'Qyer',
            sourceUrl: 'https://example.com/guide',
          },
          savedAt: '2026-04-03T00:00:00.000Z',
        },
      ],
      guideSearchHistory: [
        {
          id: 'history-1',
          keyword: '杭州周末',
          scope: 'domestic',
          createdAt: '2026-04-01T00:00:00.000Z',
        },
      ],
    });
  });

  it('serializes the bootstrap response meta block', () => {
    const response = serializeBootstrapResponse({
      account: {
        id: 'acct-1',
        name: 'Voyage Atlas',
        username: 'demo',
        role: 'admin',
      },
      fetchedAt: new Date('2026-04-05T08:30:00.000Z'),
      store: {
        users: [],
        trips: [],
        markers: [],
        wishlistItems: [],
        activeUserId: '',
        savedGuides: [],
        guideSearchHistory: [],
      },
    });

    expect(response).toEqual({
      store: {
        users: [],
        trips: [],
        markers: [],
        wishlistItems: [],
        activeUserId: '',
        savedGuides: [],
        guideSearchHistory: [],
      },
      meta: {
        accountId: 'acct-1',
        account: {
          id: 'acct-1',
          name: 'Voyage Atlas',
          username: 'demo',
          role: 'admin',
        },
        fetchedAt: '2026-04-05T08:30:00.000Z',
      },
    });
  });
});
