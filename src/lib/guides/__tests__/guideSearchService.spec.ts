import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getGuideDocument } from '../guideContentService';
import { searchGuides } from '../guideSearchService';

const DB_NAME = 'voyage-atlas-db';

function deleteDatabase(name: string) {
  return new Promise<void>((resolve, reject) => {
    const request = window.indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error(`failed to delete db ${name}`));
    request.onblocked = () => resolve();
  });
}

describe('guide services', () => {
  beforeEach(async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_GUIDE_SEARCH_PROVIDER', 'mock');
    await deleteDatabase(DB_NAME);
  });

  it('searches guides and caches the response', async () => {
    const first = await searchGuides({ keyword: 'kyoto', scope: 'international' });
    const second = await searchGuides({ keyword: 'kyoto', scope: 'international' });

    expect(first.items).toHaveLength(1);
    expect(second.items[0]?.title).toBe('Kyoto Spring Cherry Blossom Guide');
    expect(second).toEqual(first);
  });

  it('loads guide document details from the provider and cache', async () => {
    const first = await getGuideDocument('https://mock.example.com/guides/kyoto-spring');
    const second = await getGuideDocument('https://mock.example.com/guides/kyoto-spring');

    expect(first?.blocks).toHaveLength(4);
    expect(second).toEqual(first);
  });
});
