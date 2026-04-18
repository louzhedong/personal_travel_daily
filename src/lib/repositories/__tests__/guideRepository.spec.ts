import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildGuideDocumentCacheKey,
  buildGuideSearchCacheKey,
  loadGuideDocumentCache,
  loadGuideSearchCache,
  loadGuideSearchHistory,
  loadSavedGuides,
  removeSavedGuide,
  saveGuideDocumentCache,
  saveGuideSearchCache,
  saveGuideSearchHistoryItem,
  saveSavedGuide,
} from '../guideRepository';

const DB_NAME = 'voyage-atlas-db';

function deleteDatabase(name: string) {
  return new Promise<void>((resolve, reject) => {
    const request = window.indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error(`failed to delete db ${name}`));
    request.onblocked = () => resolve();
  });
}

describe('guideRepository', () => {
  beforeEach(async () => {
    await deleteDatabase(DB_NAME);
  });

  it('saves and removes saved guides', async () => {
    await saveSavedGuide({
      id: 'saved-1',
      savedByUserId: 'u1',
      keyword: 'kyoto sakura',
      result: {
        id: 'guide-1',
        title: 'Kyoto Sakura Guide',
        summary: 'Great for spring.',
        sourceName: 'Mock Travel',
        sourceUrl: 'https://example.com/guide/1',
      },
      savedAt: '2026-04-17T00:00:00.000Z',
    });

    expect(await loadSavedGuides()).toHaveLength(1);

    await removeSavedGuide('saved-1');

    expect(await loadSavedGuides()).toEqual([]);
  });

  it('returns guide search history sorted by createdAt desc', async () => {
    await saveGuideSearchHistoryItem({
      id: 'h1',
      keyword: 'kyoto',
      scope: 'international',
      createdAt: '2026-04-17T00:00:00.000Z',
    });
    await saveGuideSearchHistoryItem({
      id: 'h2',
      keyword: 'yunnan',
      scope: 'domestic',
      createdAt: '2026-04-18T00:00:00.000Z',
    });

    const history = await loadGuideSearchHistory();
    expect(history.map((item) => item.id)).toEqual(['h2', 'h1']);
  });

  it('keeps only the most recent history item for the same keyword across scopes', async () => {
    await saveGuideSearchHistoryItem({
      id: 'h1',
      keyword: 'zhoushan',
      scope: 'domestic',
      createdAt: '2026-04-17T00:00:00.000Z',
    });
    await saveGuideSearchHistoryItem({
      id: 'h2',
      keyword: ' zhoushan ',
      scope: 'domestic',
      createdAt: '2026-04-18T00:00:00.000Z',
    });
    await saveGuideSearchHistoryItem({
      id: 'h3',
      keyword: 'zhoushan',
      scope: 'all',
      createdAt: '2026-04-18T01:00:00.000Z',
    });

    const history = await loadGuideSearchHistory();

    expect(history.map((item) => item.id)).toEqual(['h3']);
    expect(history.map((item) => item.keyword)).toEqual(['zhoushan']);
  });

  it('expires stale search and document cache records', async () => {
    const searchKey = buildGuideSearchCacheKey({ keyword: 'kyoto', scope: 'international' });
    const documentKey = buildGuideDocumentCacheKey('https://example.com/guide/1');

    await saveGuideSearchCache({
      key: searchKey,
      params: { keyword: 'kyoto', scope: 'international' },
      response: {
        items: [],
        page: 1,
        pageSize: 10,
        hasMore: false,
        provider: 'mock',
        fetchedAt: '2026-04-17T00:00:00.000Z',
      },
      expiresAt: '2020-01-01T00:00:00.000Z',
    });

    await saveGuideDocumentCache({
      key: documentKey,
      document: {
        id: 'guide-1',
        title: 'Kyoto Sakura Guide',
        summary: 'Great for spring.',
        sourceName: 'Mock Travel',
        sourceUrl: 'https://example.com/guide/1',
        blocks: [{ id: 'b1', type: 'paragraph', text: 'body' }],
        fetchedAt: '2026-04-17T00:00:00.000Z',
      },
      expiresAt: '2020-01-01T00:00:00.000Z',
    });

    expect(await loadGuideSearchCache(searchKey)).toBeNull();
    expect(await loadGuideDocumentCache(documentKey)).toBeNull();
  });
});
