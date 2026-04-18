import type { GuideDocument } from '../../types';
import {
  buildGuideDocumentCacheKey,
  loadGuideDocumentCache,
  saveGuideDocumentCache,
} from '../repositories/guideRepository';
import { mockGuideContentProvider } from './providers/mockGuideSearchProvider';
import { remoteGuideContentProvider } from './providers/remoteGuideSearchProvider';
import type { GuideContentProvider } from './types';

const DOCUMENT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function resolveGuideContentProvider(): GuideContentProvider {
  return import.meta.env.VITE_GUIDE_SEARCH_PROVIDER === 'mock'
    ? mockGuideContentProvider
    : remoteGuideContentProvider;
}

export async function getGuideDocument(sourceUrl: string): Promise<GuideDocument | null> {
  const key = buildGuideDocumentCacheKey(sourceUrl);
  const cached = await loadGuideDocumentCache(key);
  if (cached) {
    return cached.document;
  }

  const provider = resolveGuideContentProvider();
  const document = await provider.getDocument(sourceUrl);
  if (!document) {
    return null;
  }

  await saveGuideDocumentCache({
    key,
    document,
    expiresAt: new Date(Date.now() + DOCUMENT_CACHE_TTL_MS).toISOString(),
  });

  return document;
}
