import type { GuideSearchParams, GuideSearchResponse } from '../../types';
import {
  buildGuideSearchCacheKey,
  loadGuideSearchCache,
  saveGuideSearchCache,
} from '../repositories/guideRepository';
import { mockGuideSearchProvider } from './providers/mockGuideSearchProvider';
import { remoteGuideSearchProvider } from './providers/remoteGuideSearchProvider';
import type { GuideSearchProvider } from './types';

const SEARCH_CACHE_TTL_MS = 30 * 60 * 1000;

function resolveGuideSearchProvider(): GuideSearchProvider {
  return import.meta.env.VITE_GUIDE_SEARCH_PROVIDER === 'mock'
    ? mockGuideSearchProvider
    : remoteGuideSearchProvider;
}

export async function searchGuides(params: GuideSearchParams): Promise<GuideSearchResponse> {
  const key = buildGuideSearchCacheKey(params);
  const cached = await loadGuideSearchCache(key);
  if (cached) {
    return cached.response;
  }

  const provider = resolveGuideSearchProvider();
  const response = await provider.search(params);

  if (response.items.length > 0) {
    await saveGuideSearchCache({
      key,
      params,
      response,
      expiresAt: new Date(Date.now() + SEARCH_CACHE_TTL_MS).toISOString(),
    });
  }

  return response;
}
