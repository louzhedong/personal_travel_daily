import type { TravelStore, UserProfile, VisitMarker } from '../../types';

const DB_NAME = 'voyage-atlas-db';
const DB_VERSION = 2;
const USERS_STORE = 'users';
const MARKERS_STORE = 'markers';
const META_STORE = 'meta';
const META_ACTIVE_USER_KEY = 'activeUserId';
const LEGACY_APP_STORE = 'app';
const LEGACY_APP_STORE_KEY = 'travel-store';

type LegacyMarkerShape = Partial<VisitMarker> & { visitedAt?: string; imageUrl?: string };
type LegacyStoreShape = Partial<TravelStore> & {
  markers?: LegacyMarkerShape[];
  users?: Partial<UserProfile>[];
};

export interface TravelStoreSnapshot {
  users: Partial<UserProfile>[];
  markers: LegacyMarkerShape[];
  activeUserId: string | null;
}

interface MetaRecord {
  key: string;
  value: string;
}

export function supportsIndexedDb() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function openDatabase(): Promise<IDBDatabase> {
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

function readAllFromStore<T>(database: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve((request.result ?? []) as T[]);
    request.onerror = () => reject(request.error ?? new Error(`读取 ${storeName} 失败`));
  });
}

function readMetaRecord(database: IDBDatabase, key: string): Promise<MetaRecord | undefined> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(META_STORE, 'readonly');
    const store = transaction.objectStore(META_STORE);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result as MetaRecord | undefined);
    request.onerror = () => reject(request.error ?? new Error('读取 meta 失败'));
  });
}

export async function loadTravelStoreSnapshot(): Promise<TravelStoreSnapshot | null> {
  if (!supportsIndexedDb()) {
    return null;
  }

  const database = await openDatabase();
  try {
    const [users, markers, activeUserRecord] = await Promise.all([
      readAllFromStore<Partial<UserProfile>>(database, USERS_STORE),
      readAllFromStore<LegacyMarkerShape>(database, MARKERS_STORE),
      readMetaRecord(database, META_ACTIVE_USER_KEY),
    ]);

    const snapshot: TravelStoreSnapshot = {
      users,
      markers,
      activeUserId: activeUserRecord?.value ?? null,
    };

    const hasData = users.length > 0 || markers.length > 0 || snapshot.activeUserId !== null;
    return hasData ? snapshot : null;
  } finally {
    database.close();
  }
}

export async function saveTravelStoreSnapshot(store: TravelStore): Promise<void> {
  if (!supportsIndexedDb()) {
    return;
  }

  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction([USERS_STORE, MARKERS_STORE, META_STORE], 'readwrite');
      const usersStore = transaction.objectStore(USERS_STORE);
      const markersStore = transaction.objectStore(MARKERS_STORE);
      const metaStore = transaction.objectStore(META_STORE);

      usersStore.clear();
      markersStore.clear();

      store.users.forEach((user) => usersStore.put(user));
      store.markers.forEach((marker) => markersStore.put(marker));
      metaStore.put({
        key: META_ACTIVE_USER_KEY,
        value: store.activeUserId,
      } satisfies MetaRecord);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('写入 IndexedDB 失败'));
      transaction.onabort = () => reject(transaction.error ?? new Error('写入 IndexedDB 被中断'));
    });
  } finally {
    database.close();
  }
}
