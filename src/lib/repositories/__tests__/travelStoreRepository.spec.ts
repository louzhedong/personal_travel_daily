import { beforeEach, describe, expect, it } from 'vitest';
import type { TravelStore } from '../../../types';
import {
  loadTravelStoreSnapshot,
  saveTravelStoreSnapshot,
  supportsIndexedDb,
} from '../travelStoreRepository';

const DB_NAME = 'voyage-atlas-db';
const USERS_STORE = 'users';
const MARKERS_STORE = 'markers';
const META_STORE = 'meta';
const SAVED_GUIDES_STORE = 'savedGuides';
const GUIDE_SEARCH_HISTORY_STORE = 'guideSearchHistory';
const LEGACY_APP_STORE = 'app';
const LEGACY_APP_STORE_KEY = 'travel-store';

function deleteDatabase(name: string) {
  return new Promise<void>((resolve, reject) => {
    const request = window.indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error(`删除数据库 ${name} 失败`));
    request.onblocked = () => resolve();
  });
}

function openDatabase(name: string, version?: number, onUpgrade?: (database: IDBDatabase) => void) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = version ? window.indexedDB.open(name, version) : window.indexedDB.open(name);

    request.onupgradeneeded = () => {
      onUpgrade?.(request.result);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error(`打开数据库 ${name} 失败`));
  });
}

function getAllFromStore<T>(database: IDBDatabase, storeName: string) {
  return new Promise<T[]>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve((request.result ?? []) as T[]);
    request.onerror = () => reject(request.error ?? new Error(`读取 ${storeName} 失败`));
  });
}

function getFromStore<T>(database: IDBDatabase, storeName: string, key: string) {
  return new Promise<T | undefined>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error ?? new Error(`读取 ${storeName}/${key} 失败`));
  });
}

describe('travelStoreRepository', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await deleteDatabase(DB_NAME);
  });

  it('reads and writes users / markers / meta in independent object stores', async () => {
    expect(supportsIndexedDb()).toBe(true);

    const store: TravelStore = {
      users: [
        { id: 'u1', name: '小悠', color: '#2563eb' },
        { id: 'u2', name: '阿泽', color: '#f97316' },
      ],
      markers: [
        {
          id: 'm1',
          userId: 'u2',
          scope: 'domestic',
          scopeId: 'xinjiang',
          scopeName: '新疆',
          city: '乌鲁木齐',
          note: '风很大',
          imageUrls: ['https://example.com/a.jpg'],
          visitedStartAt: '2026-04-01',
          visitedEndAt: '2026-04-03',
          createdAt: '2026-04-10T00:00:00.000Z',
        },
      ],
      activeUserId: 'u2',
      savedGuides: [
        {
          id: 'g1',
          savedByUserId: 'u2',
          keyword: '新疆 旅游 攻略',
          result: {
            id: 'r1',
            title: '新疆环线攻略',
            summary: '适合 7 到 10 天自驾。',
            sourceName: 'Mock Travel',
            sourceUrl: 'https://example.com/guide/xj',
          },
          savedAt: '2026-04-11T00:00:00.000Z',
        },
      ],
      guideSearchHistory: [
        {
          id: 'h1',
          keyword: '新疆 旅游 攻略',
          scope: 'domestic',
          createdAt: '2026-04-11T00:00:00.000Z',
        },
      ],
    };

    await saveTravelStoreSnapshot(store);

    const snapshot = await loadTravelStoreSnapshot();
    expect(snapshot).toEqual({
      users: store.users,
      markers: store.markers,
      activeUserId: 'u2',
      savedGuides: store.savedGuides,
      guideSearchHistory: store.guideSearchHistory,
    });

    const database = await openDatabase(DB_NAME);
    try {
      expect(Array.from(database.objectStoreNames)).toEqual(
        expect.arrayContaining([USERS_STORE, MARKERS_STORE, META_STORE, SAVED_GUIDES_STORE, GUIDE_SEARCH_HISTORY_STORE]),
      );

      const [users, markers, activeUserMeta, savedGuides, guideSearchHistory] = await Promise.all([
        getAllFromStore<{ id: string }>(database, USERS_STORE),
        getAllFromStore<{ id: string }>(database, MARKERS_STORE),
        getFromStore<{ key: string; value: string }>(database, META_STORE, 'activeUserId'),
        getAllFromStore<{ id: string }>(database, SAVED_GUIDES_STORE),
        getAllFromStore<{ id: string }>(database, GUIDE_SEARCH_HISTORY_STORE),
      ]);

      expect(users).toHaveLength(2);
      expect(markers).toHaveLength(1);
      expect(activeUserMeta).toEqual({ key: 'activeUserId', value: 'u2' });
      expect(savedGuides).toHaveLength(1);
      expect(guideSearchHistory).toHaveLength(1);
    } finally {
      database.close();
    }
  });

  it('migrates legacy v1 app store data into the split schema on upgrade', async () => {
    const legacyDatabase = await openDatabase(DB_NAME, 1, (database) => {
      const legacyStore = database.createObjectStore(LEGACY_APP_STORE);
      legacyStore.put(
        {
          users: [{ id: 'u1', name: '小悠', color: '#2563eb' }],
          markers: [
            {
              id: 'm-old',
              userId: 'u1',
              scope: 'international',
              scopeId: 'japan',
              scopeName: '日本',
              city: '东京',
              note: '樱花季',
              imageUrl: 'https://example.com/old.jpg',
              visitedAt: '2025-03-20',
              createdAt: '2025-03-21T00:00:00.000Z',
            },
          ],
          activeUserId: 'u1',
          savedGuides: [
            {
              id: 'g-old',
              savedByUserId: 'u1',
              keyword: '日本 樱花 攻略',
              result: {
                id: 'r-old',
                title: '日本樱花攻略',
                summary: '东京和京都都适合。',
                sourceName: 'Mock Travel',
                sourceUrl: 'https://example.com/guide/jp',
              },
              savedAt: '2025-03-22T00:00:00.000Z',
            },
          ],
          guideSearchHistory: [
            {
              id: 'h-old',
              keyword: '日本 樱花 攻略',
              scope: 'international',
              createdAt: '2025-03-22T00:00:00.000Z',
            },
          ],
        },
        LEGACY_APP_STORE_KEY,
      );
    });
    legacyDatabase.close();

    const snapshot = await loadTravelStoreSnapshot();
    expect(snapshot).toEqual({
      users: [{ id: 'u1', name: '小悠', color: '#2563eb' }],
      markers: [
        expect.objectContaining({
          id: 'm-old',
          scopeName: '日本',
          imageUrl: 'https://example.com/old.jpg',
          visitedAt: '2025-03-20',
        }),
      ],
      activeUserId: 'u1',
      savedGuides: [
        expect.objectContaining({
          id: 'g-old',
          keyword: '日本 樱花 攻略',
        }),
      ],
      guideSearchHistory: [
        expect.objectContaining({
          id: 'h-old',
          keyword: '日本 樱花 攻略',
        }),
      ],
    });

    const database = await openDatabase(DB_NAME);
    try {
      const [users, markers, activeUserMeta, savedGuides, guideSearchHistory] = await Promise.all([
        getAllFromStore<{ id: string; name: string }>(database, USERS_STORE),
        getAllFromStore<{ id: string; imageUrl?: string; visitedAt?: string }>(database, MARKERS_STORE),
        getFromStore<{ key: string; value: string }>(database, META_STORE, 'activeUserId'),
        getAllFromStore<{ id: string; keyword: string }>(database, SAVED_GUIDES_STORE),
        getAllFromStore<{ id: string; keyword: string }>(database, GUIDE_SEARCH_HISTORY_STORE),
      ]);

      expect(users).toEqual([{ id: 'u1', name: '小悠', color: '#2563eb' }]);
      expect(markers).toEqual([
        expect.objectContaining({
          id: 'm-old',
          imageUrl: 'https://example.com/old.jpg',
          visitedAt: '2025-03-20',
        }),
      ]);
      expect(activeUserMeta).toEqual({ key: 'activeUserId', value: 'u1' });
      expect(savedGuides).toEqual([
        expect.objectContaining({
          id: 'g-old',
          keyword: '日本 樱花 攻略',
        }),
      ]);
      expect(guideSearchHistory).toEqual([
        expect.objectContaining({
          id: 'h-old',
          keyword: '日本 樱花 攻略',
        }),
      ]);
    } finally {
      database.close();
    }
  });
});
