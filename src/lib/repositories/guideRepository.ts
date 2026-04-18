import type {
  GuideDocumentCacheRecord,
  GuideSearchCacheRecord,
  GuideSearchHistoryItem,
  GuideSearchParams,
  SavedGuide,
} from '../../types';
import {
  deleteRecord,
  GUIDE_DOCUMENT_CACHE_STORE,
  GUIDE_SEARCH_CACHE_STORE,
  GUIDE_SEARCH_HISTORY_STORE,
  openDatabase,
  putRecord,
  readAllFromStore,
  readRecord,
  SAVED_GUIDES_STORE,
  supportsIndexedDb,
} from './indexedDb';

const GUIDE_SEARCH_CACHE_VERSION = 'v3';

function buildGuideSearchHistoryIdentity(item: Pick<GuideSearchHistoryItem, 'keyword' | 'scope'>) {
  return item.keyword.trim().toLowerCase();
}

export function buildGuideSearchCacheKey(params: GuideSearchParams) {
  const keyword = params.keyword.trim().toLowerCase();
  const scope = params.scope ?? 'all';
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  return `${GUIDE_SEARCH_CACHE_VERSION}:${scope}:${keyword}:${page}:${pageSize}`;
}

export function buildGuideDocumentCacheKey(sourceUrl: string) {
  return sourceUrl.trim().toLowerCase();
}

export async function loadSavedGuides(): Promise<SavedGuide[]> {
  if (!supportsIndexedDb()) {
    return [];
  }

  const database = await openDatabase();
  try {
    return await readAllFromStore<SavedGuide>(database, SAVED_GUIDES_STORE);
  } finally {
    database.close();
  }
}

export async function saveSavedGuide(savedGuide: SavedGuide): Promise<void> {
  if (!supportsIndexedDb()) {
    return;
  }

  const database = await openDatabase();
  try {
    await putRecord(database, SAVED_GUIDES_STORE, savedGuide);
  } finally {
    database.close();
  }
}

export async function removeSavedGuide(savedGuideId: string): Promise<void> {
  if (!supportsIndexedDb()) {
    return;
  }

  const database = await openDatabase();
  try {
    await deleteRecord(database, SAVED_GUIDES_STORE, savedGuideId);
  } finally {
    database.close();
  }
}

export async function loadGuideSearchHistory(limit = 20): Promise<GuideSearchHistoryItem[]> {
  if (!supportsIndexedDb()) {
    return [];
  }

  const database = await openDatabase();
  try {
    const items = await readAllFromStore<GuideSearchHistoryItem>(database, GUIDE_SEARCH_HISTORY_STORE);
    const seen = new Set<string>();

    return items
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter((item) => {
        const identity = buildGuideSearchHistoryIdentity(item);
        if (seen.has(identity)) {
          return false;
        }
        seen.add(identity);
        return true;
      })
      .slice(0, limit);
  } finally {
    database.close();
  }
}

export async function saveGuideSearchHistoryItem(item: GuideSearchHistoryItem): Promise<void> {
  if (!supportsIndexedDb()) {
    return;
  }

  const database = await openDatabase();
  try {
    const items = await readAllFromStore<GuideSearchHistoryItem>(database, GUIDE_SEARCH_HISTORY_STORE);
    const identity = buildGuideSearchHistoryIdentity(item);

    await Promise.all(
      items
        .filter((existingItem) => buildGuideSearchHistoryIdentity(existingItem) === identity)
        .map((existingItem) => deleteRecord(database, GUIDE_SEARCH_HISTORY_STORE, existingItem.id)),
    );

    await putRecord(database, GUIDE_SEARCH_HISTORY_STORE, item);
  } finally {
    database.close();
  }
}

export async function loadGuideSearchCache(
  key: string,
): Promise<GuideSearchCacheRecord | null> {
  if (!supportsIndexedDb()) {
    return null;
  }

  const database = await openDatabase();
  try {
    const record = await readRecord<GuideSearchCacheRecord>(database, GUIDE_SEARCH_CACHE_STORE, key);
    if (!record) {
      return null;
    }
    if (record.expiresAt <= new Date().toISOString()) {
      await deleteRecord(database, GUIDE_SEARCH_CACHE_STORE, key);
      return null;
    }
    return record;
  } finally {
    database.close();
  }
}

export async function saveGuideSearchCache(record: GuideSearchCacheRecord): Promise<void> {
  if (!supportsIndexedDb()) {
    return;
  }

  const database = await openDatabase();
  try {
    await putRecord(database, GUIDE_SEARCH_CACHE_STORE, record);
  } finally {
    database.close();
  }
}

export async function loadGuideDocumentCache(
  key: string,
): Promise<GuideDocumentCacheRecord | null> {
  if (!supportsIndexedDb()) {
    return null;
  }

  const database = await openDatabase();
  try {
    const record = await readRecord<GuideDocumentCacheRecord>(database, GUIDE_DOCUMENT_CACHE_STORE, key);
    if (!record) {
      return null;
    }
    if (record.expiresAt <= new Date().toISOString()) {
      await deleteRecord(database, GUIDE_DOCUMENT_CACHE_STORE, key);
      return null;
    }
    return record;
  } finally {
    database.close();
  }
}

export async function saveGuideDocumentCache(record: GuideDocumentCacheRecord): Promise<void> {
  if (!supportsIndexedDb()) {
    return;
  }

  const database = await openDatabase();
  try {
    await putRecord(database, GUIDE_DOCUMENT_CACHE_STORE, record);
  } finally {
    database.close();
  }
}
