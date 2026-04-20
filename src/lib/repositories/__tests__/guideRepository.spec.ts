import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildGuideDocumentCacheKey,
  buildGuideSearchCacheKey,
  findSavedGuideBySourceUrl,
  loadGuideDocumentCache,
  loadGuideSearchCache,
  loadGuideSearchHistory,
  loadSavedGuides,
  loadSavedGuidesByMarkerId,
  loadSavedGuidesByUserId,
  removeSavedGuide,
  saveGuideDocumentCache,
  saveGuideSearchCache,
  saveGuideSearchHistoryItem,
  saveSavedGuide,
  upsertSavedGuide,
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

  it('loads saved guides by user and marker', async () => {
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
    await saveSavedGuide({
      id: 'saved-2',
      savedByUserId: 'u1',
      markerId: 'marker-1',
      keyword: 'kyoto temple',
      result: {
        id: 'guide-2',
        title: 'Kyoto Temple Guide',
        summary: 'Temple route.',
        sourceName: 'Mock Travel',
        sourceUrl: 'https://example.com/guide/2',
      },
      savedAt: '2026-04-18T00:00:00.000Z',
    });
    await saveSavedGuide({
      id: 'saved-3',
      savedByUserId: 'u2',
      markerId: 'marker-2',
      keyword: 'osaka food',
      result: {
        id: 'guide-3',
        title: 'Osaka Food Guide',
        summary: 'Eat more.',
        sourceName: 'Mock Travel',
        sourceUrl: 'https://example.com/guide/3',
      },
      savedAt: '2026-04-19T00:00:00.000Z',
    });

    expect((await loadSavedGuidesByUserId('u1')).map((item) => item.id)).toEqual(['saved-2', 'saved-1']);
    expect((await loadSavedGuidesByMarkerId('marker-1')).map((item) => item.id)).toEqual(['saved-2']);
  });

  it('upserts favorite guides by source url without duplicates', async () => {
    const firstSavedGuide = await upsertSavedGuide({
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

    const secondSavedGuide = await upsertSavedGuide({
      id: 'saved-2',
      savedByUserId: 'u1',
      keyword: 'kyoto sakura trip',
      result: {
        id: 'guide-1b',
        title: 'Kyoto Sakura Guide Updated',
        summary: 'Updated summary.',
        sourceName: 'Mock Travel',
        sourceUrl: 'https://example.com/guide/1',
      },
      savedAt: '2026-04-19T00:00:00.000Z',
    });

    const savedGuides = await loadSavedGuides();
    expect(savedGuides).toHaveLength(1);
    expect(firstSavedGuide.id).toBe('saved-1');
    expect(secondSavedGuide.id).toBe('saved-1');
    expect(savedGuides[0].result.title).toBe('Kyoto Sakura Guide Updated');
    expect(savedGuides[0].savedAt).toBe('2026-04-17T00:00:00.000Z');
  });

  it('finds and removes marker-linked guides by source url', async () => {
    await upsertSavedGuide({
      id: 'saved-1',
      savedByUserId: 'u1',
      markerId: 'marker-1',
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

    const found = await findSavedGuideBySourceUrl('u1', 'https://example.com/guide/1', 'marker-1');
    expect(found?.id).toBe('saved-1');

    await removeSavedGuide('saved-1');
    expect(await loadSavedGuidesByMarkerId('marker-1')).toEqual([]);
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
