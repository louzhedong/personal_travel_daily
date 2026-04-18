import type { TravelStore, UserProfile, SavedGuide, GuideSearchHistoryItem } from '../../types';
import {
  META_ACTIVE_USER_KEY,
  META_STORE,
  MARKERS_STORE,
  SAVED_GUIDES_STORE,
  GUIDE_SEARCH_HISTORY_STORE,
  USERS_STORE,
  openDatabase,
  readAllFromStore,
  readRecord,
  replaceAllRecords,
  supportsIndexedDb,
  type LegacyMarkerShape,
  type LegacyStoreShape,
} from './indexedDb';

export interface TravelStoreSnapshot {
  users: Partial<UserProfile>[];
  markers: LegacyMarkerShape[];
  activeUserId: string | null;
  savedGuides: Partial<SavedGuide>[];
  guideSearchHistory: Partial<GuideSearchHistoryItem>[];
}

interface MetaRecord {
  key: string;
  value: string;
}

export { supportsIndexedDb } from './indexedDb';

export async function loadTravelStoreSnapshot(): Promise<TravelStoreSnapshot | null> {
  if (!supportsIndexedDb()) {
    return null;
  }

  const database = await openDatabase();
  try {
    const [users, markers, activeUserRecord, savedGuides, guideSearchHistory] = await Promise.all([
      readAllFromStore<Partial<UserProfile>>(database, USERS_STORE),
      readAllFromStore<LegacyMarkerShape>(database, MARKERS_STORE),
      readRecord<MetaRecord>(database, META_STORE, META_ACTIVE_USER_KEY),
      readAllFromStore<Partial<SavedGuide>>(database, SAVED_GUIDES_STORE),
      readAllFromStore<Partial<GuideSearchHistoryItem>>(database, GUIDE_SEARCH_HISTORY_STORE),
    ]);

    const snapshot: TravelStoreSnapshot = {
      users,
      markers,
      activeUserId: activeUserRecord?.value ?? null,
      savedGuides,
      guideSearchHistory,
    };

    const hasData =
      users.length > 0 ||
      markers.length > 0 ||
      snapshot.activeUserId !== null ||
      savedGuides.length > 0 ||
      guideSearchHistory.length > 0;

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
    await Promise.all([
      replaceAllRecords(database, USERS_STORE, store.users),
      replaceAllRecords(database, MARKERS_STORE, store.markers),
      replaceAllRecords(database, SAVED_GUIDES_STORE, store.savedGuides),
      replaceAllRecords(database, GUIDE_SEARCH_HISTORY_STORE, store.guideSearchHistory),
      replaceAllRecords(database, META_STORE, [
        {
          key: META_ACTIVE_USER_KEY,
          value: store.activeUserId,
        } satisfies MetaRecord,
      ]),
    ]);
  } finally {
    database.close();
  }
}

export type { LegacyStoreShape };
