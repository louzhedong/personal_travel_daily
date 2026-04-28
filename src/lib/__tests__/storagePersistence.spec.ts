import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loadTravelStoreSnapshotMock: vi.fn(),
  saveTravelStoreSnapshotMock: vi.fn(),
  supportsIndexedDbMock: vi.fn(),
}));

vi.mock('../repositories/travelStoreRepository', () => ({
  loadTravelStoreSnapshot: mocks.loadTravelStoreSnapshotMock,
  saveTravelStoreSnapshot: mocks.saveTravelStoreSnapshotMock,
  supportsIndexedDb: mocks.supportsIndexedDbMock,
}));

import {
  createDefaultStore,
  createGuideSearchHistoryItem,
  createMarker,
  createSavedGuide,
  createUser,
  loadPersistedStore,
  persistStore,
} from '../storage';

describe('storage persistence helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.supportsIndexedDbMock.mockReturnValue(false);
  });

  it('creates the default store shape', () => {
    const store = createDefaultStore();
    expect(store.users.length).toBeGreaterThan(0);
    expect(store.activeUserId).toBe(store.users[0].id);
    expect(store.trips).toEqual([]);
    expect(store.markers).toEqual([]);
    expect(store.savedGuides).toEqual([]);
    expect(store.guideSearchHistory).toEqual([]);
  });

  it('loads from legacy localStorage when indexeddb is unavailable and falls back to defaults', async () => {
    localStorage.setItem(
      'personal-travel-diary-store',
      JSON.stringify({
        users: [{ id: 'u1', name: '小悠', color: '#2563eb' }],
        trips: [
          {
            id: 'trip-1',
            name: '京都春游',
            note: '',
            startsAt: '2026-04-01',
            endsAt: '2026-04-05',
            createdAt: '2026-03-01T00:00:00.000Z',
          },
        ],
        markers: [
          {
            id: 'm1',
            userId: 'u1',
            scope: 'domestic',
            scopeId: 'zj',
            scopeName: '浙江',
            city: '杭州',
            note: '西湖',
            visitedAt: '2026-04-01',
            createdAt: '2026-04-01T00:00:00.000Z',
            imageUrl: 'https://example.com/1.jpg',
          },
        ],
        activeUserId: 'u1',
        savedGuides: [
          {
            id: 'saved-1',
            savedByUserId: 'u1',
            keyword: '京都',
            savedAt: '2026-04-01T00:00:00.000Z',
            result: {
              id: 'guide-1',
              title: '京都慢游',
              summary: '三天路线',
              sourceName: 'Mock',
              sourceUrl: 'https://example.com/guide',
              tags: ['food', 1, 'walk'],
            },
          },
        ],
        guideSearchHistory: [{ id: 'h1', keyword: '京都', scope: 'international', createdAt: '2026-04-01T00:00:00.000Z' }],
      }),
    );

    const store = await loadPersistedStore();

    expect(store.activeUserId).toBe('u1');
    expect(store.trips).toHaveLength(1);
    expect(store.markers[0]).toMatchObject({
      visitedStartAt: '2026-04-01',
      visitedEndAt: '2026-04-01',
      imageUrls: ['https://example.com/1.jpg'],
    });
    expect(store.savedGuides[0].result).toMatchObject({
      id: 'guide-1',
      tags: ['food', 'walk'],
    });
  });

  it('migrates indexeddb snapshot and falls back to localStorage when persistence fails', async () => {
    mocks.supportsIndexedDbMock.mockReturnValue(true);
    mocks.loadTravelStoreSnapshotMock.mockResolvedValueOnce({
      users: [{ id: 'u1', name: '小悠', color: '#2563eb' }],
      markers: [],
      trips: [],
      activeUserId: 'u1',
      savedGuides: [],
      guideSearchHistory: [],
    });

    const snapshotStore = await loadPersistedStore();
    expect(snapshotStore.activeUserId).toBe('u1');

    mocks.loadTravelStoreSnapshotMock.mockResolvedValueOnce(null);
    mocks.saveTravelStoreSnapshotMock.mockResolvedValueOnce(undefined);
    const migratedStore = await loadPersistedStore();
    expect(mocks.saveTravelStoreSnapshotMock).toHaveBeenCalledWith(migratedStore);

    localStorage.setItem(
      'personal-travel-diary-store',
      JSON.stringify({
        users: [{ id: 'u1', name: '小悠', color: '#2563eb' }],
        markers: [],
        activeUserId: 'u1',
      }),
    );
    mocks.loadTravelStoreSnapshotMock.mockRejectedValueOnce(new Error('db down'));
    const fallbackStore = await loadPersistedStore();
    expect(fallbackStore.activeUserId).toBe('u1');
  });

  it('persists into indexeddb or localStorage fallback', async () => {
    const store = createDefaultStore();

    await persistStore(store);
    expect(localStorage.getItem('personal-travel-diary-store')).toContain('"users"');

    localStorage.clear();
    mocks.supportsIndexedDbMock.mockReturnValue(true);
    mocks.saveTravelStoreSnapshotMock.mockResolvedValueOnce(undefined);
    await persistStore(store);
    expect(mocks.saveTravelStoreSnapshotMock).toHaveBeenCalledWith(store);

    mocks.saveTravelStoreSnapshotMock.mockRejectedValueOnce(new Error('fail'));
    await persistStore(store);
    expect(localStorage.getItem('personal-travel-diary-store')).toContain('"users"');
  });

  it('creates deterministic entities based on time and random suffixes', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1712304000000);
    vi.spyOn(Math, 'random').mockReturnValue(0.123456);
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-04-05T08:30:00.000Z');

    expect(createUser('小悠', '#2563eb')).toEqual({
      id: expect.stringContaining('user-1712304000000-'),
      name: '小悠',
      color: '#2563eb',
    });
    expect(
      createMarker({
        userId: 'u1',
        scope: 'domestic',
        scopeId: 'zj',
        scopeName: '浙江',
        city: '杭州',
        note: '西湖',
        visitedStartAt: '2026-04-01',
        visitedEndAt: '2026-04-01',
      }),
    ).toMatchObject({
      id: expect.stringContaining('marker-1712304000000-'),
      createdAt: '2026-04-05T08:30:00.000Z',
    });
    expect(
      createSavedGuide({
        savedByUserId: 'u1',
        keyword: '京都',
        result: {
          id: 'guide-1',
          title: '京都慢游',
          summary: '三天路线',
          sourceName: 'Mock',
          sourceUrl: 'https://example.com/guide',
        },
      }),
    ).toMatchObject({
      id: expect.stringContaining('guide-1712304000000-'),
      savedAt: '2026-04-05T08:30:00.000Z',
    });
    expect(createGuideSearchHistoryItem('京都', 'international')).toMatchObject({
      id: expect.stringContaining('guide-history-1712304000000-'),
      keyword: '京都',
      scope: 'international',
      createdAt: '2026-04-05T08:30:00.000Z',
    });
  });
});
