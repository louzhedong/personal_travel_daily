import { domesticPoiStarterAdapter } from './domesticPoiStarterAdapter.mjs';
import { geoapifyPoiAdapter } from './geoapifyPoiAdapter.mjs';
import { kyotoTravelCnAdapter } from './kyotoTravelCnAdapter.mjs';
import { qyerForumAdapter } from './qyerForumAdapter.mjs';
import { zhWikipediaAdapter } from './zhWikipediaAdapter.mjs';
import { zhWikivoyageAdapter } from './zhWikivoyageAdapter.mjs';

const adapters = [
  qyerForumAdapter,
  geoapifyPoiAdapter,
  zhWikivoyageAdapter,
  zhWikipediaAdapter,
  domesticPoiStarterAdapter,
  kyotoTravelCnAdapter,
];

export function listAdapterEntries() {
  return adapters.flatMap((adapter) => adapter.entries);
}

export async function searchEntriesFromAdapters(params) {
  const results = await Promise.all(
    adapters.map((adapter) =>
      typeof adapter.search === 'function'
        ? adapter.search(params).catch(() => [])
        : Promise.resolve(adapter.entries),
    ),
  );

  return results.flat();
}

export async function loadDocumentFromAdapters(sourceUrl) {
  for (const adapter of adapters) {
    const document = await adapter.getDocument(sourceUrl);
    if (document) {
      return document;
    }
  }
  return null;
}
