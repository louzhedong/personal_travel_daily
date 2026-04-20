import type {
  GuideDocumentCacheRecord,
  GuideSearchCacheRecord,
  GuideSearchHistoryItem,
  SavedGuide,
  TravelStore,
  UserProfile,
  VisitMarker,
} from '../../types';

export const DB_NAME = 'voyage-atlas-db';
export const DB_VERSION = 3;
export const USERS_STORE = 'users';
export const MARKERS_STORE = 'markers';
export const META_STORE = 'meta';
export const SAVED_GUIDES_STORE = 'savedGuides';
export const GUIDE_SEARCH_HISTORY_STORE = 'guideSearchHistory';
export const GUIDE_SEARCH_CACHE_STORE = 'guideSearchCache';
export const GUIDE_DOCUMENT_CACHE_STORE = 'guideDocumentCache';
export const META_ACTIVE_USER_KEY = 'activeUserId';
export const LEGACY_APP_STORE = 'app';
export const LEGACY_APP_STORE_KEY = 'travel-store';

export interface MetaRecord {
  key: string;
  value: string;
}

type LegacyMarkerShape = Partial<VisitMarker> & { visitedAt?: string; imageUrl?: string };
type LegacyStoreShape = Partial<TravelStore> & {
  markers?: LegacyMarkerShape[];
  users?: Partial<UserProfile>[];
  savedGuides?: Partial<SavedGuide>[];
  guideSearchHistory?: Partial<GuideSearchHistoryItem>[];
};

export function supportsIndexedDb() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(USERS_STORE)) {
        database.createObjectStore(USERS_STORE, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(MARKERS_STORE)) {
        database.createObjectStore(MARKERS_STORE, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(META_STORE)) {
        database.createObjectStore(META_STORE, { keyPath: 'key' });
      }
      if (!database.objectStoreNames.contains(SAVED_GUIDES_STORE)) {
        database.createObjectStore(SAVED_GUIDES_STORE, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(GUIDE_SEARCH_HISTORY_STORE)) {
        database.createObjectStore(GUIDE_SEARCH_HISTORY_STORE, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(GUIDE_SEARCH_CACHE_STORE)) {
        database.createObjectStore(GUIDE_SEARCH_CACHE_STORE, { keyPath: 'key' });
      }
      if (!database.objectStoreNames.contains(GUIDE_DOCUMENT_CACHE_STORE)) {
        database.createObjectStore(GUIDE_DOCUMENT_CACHE_STORE, { keyPath: 'key' });
      }

      if (database.objectStoreNames.contains(LEGACY_APP_STORE) && request.transaction) {
        const legacyStore = request.transaction.objectStore(LEGACY_APP_STORE);
        const legacyReadRequest = legacyStore.get(LEGACY_APP_STORE_KEY);

        legacyReadRequest.onsuccess = () => {
          const legacySnapshot = legacyReadRequest.result as LegacyStoreShape | undefined;
          if (!legacySnapshot) {
            return;
          }

          const usersStore = request.transaction?.objectStore(USERS_STORE);
          const markersStore = request.transaction?.objectStore(MARKERS_STORE);
          const metaStore = request.transaction?.objectStore(META_STORE);
          const savedGuidesStore = request.transaction?.objectStore(SAVED_GUIDES_STORE);
          const guideSearchHistoryStore = request.transaction?.objectStore(GUIDE_SEARCH_HISTORY_STORE);

          legacySnapshot.users?.forEach((user) => {
            if (user && typeof user.id === 'string') {
              usersStore?.put(user);
            }
          });

          legacySnapshot.markers?.forEach((marker) => {
            if (marker && typeof marker.id === 'string') {
              markersStore?.put(marker);
            }
          });

          legacySnapshot.savedGuides?.forEach((guide) => {
            if (guide && typeof guide.id === 'string') {
              savedGuidesStore?.put(guide);
            }
          });

          legacySnapshot.guideSearchHistory?.forEach((item) => {
            if (item && typeof item.id === 'string') {
              guideSearchHistoryStore?.put(item);
            }
          });

          if (typeof legacySnapshot.activeUserId === 'string') {
            metaStore?.put({
              key: META_ACTIVE_USER_KEY,
              value: legacySnapshot.activeUserId,
            } satisfies MetaRecord);
          }
        };
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('打开 IndexedDB 失败'));
  });
}

export function readAllFromStore<T>(database: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve((request.result ?? []) as T[]);
    request.onerror = () => reject(request.error ?? new Error(`读取 ${storeName} 失败`));
  });
}

export function readRecord<T>(database: IDBDatabase, storeName: string, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error ?? new Error(`读取 ${storeName}/${key} 失败`));
  });
}

export function replaceAllRecords<T extends { id: string } | { key: string }>(
  database: IDBDatabase,
  storeName: string,
  records: T[],
) {
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    store.clear();
    records.forEach((record) => store.put(record));

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error(`写入 ${storeName} 失败`));
    transaction.onabort = () => reject(transaction.error ?? new Error(`写入 ${storeName} 被中断`));
  });
}

export function putRecord<T>(database: IDBDatabase, storeName: string, record: T) {
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.put(record);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error(`写入 ${storeName} 失败`));
    transaction.onabort = () => reject(transaction.error ?? new Error(`写入 ${storeName} 被中断`));
  });
}

export function deleteRecord(database: IDBDatabase, storeName: string, key: string) {
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.delete(key);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error(`删除 ${storeName}/${key} 失败`));
    transaction.onabort = () => reject(transaction.error ?? new Error(`删除 ${storeName}/${key} 被中断`));
  });
}

export type { LegacyMarkerShape, LegacyStoreShape, GuideSearchCacheRecord, GuideDocumentCacheRecord };
