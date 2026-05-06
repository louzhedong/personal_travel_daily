import { createGuideSearchLog } from '../api/guideSearchLogApi';
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

function getSourceDomain(sourceUrl?: string) {
  if (!sourceUrl) {
    return undefined;
  }

  try {
    return new URL(sourceUrl).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

async function logGuideSearch(
  params: GuideSearchParams,
  input: {
    provider: string;
    resultCount: number;
    hasMore: boolean;
    durationMs: number;
    status: 'success' | 'empty' | 'error';
    errorCode?: string;
    sourceName?: string;
    sourceDomain?: string;
  },
) {
  if (!params.companionId) {
    return;
  }

  try {
    await createGuideSearchLog({
      companionId: params.companionId,
      keyword: params.keyword,
      scope: params.scope ?? 'all',
      provider: input.provider,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
      resultCount: input.resultCount,
      hasMore: input.hasMore,
      durationMs: input.durationMs,
      status: input.status,
      errorCode: input.errorCode,
      sourceName: input.sourceName,
      sourceDomain: input.sourceDomain,
    });
  } catch {
    // Logging failure must not block the primary guide-search experience.
  }
}

function resolveGuideSearchProvider(): GuideSearchProvider {
  return import.meta.env.VITE_GUIDE_SEARCH_PROVIDER === 'mock'
    ? mockGuideSearchProvider
    : remoteGuideSearchProvider;
}

export async function searchGuides(params: GuideSearchParams): Promise<GuideSearchResponse> {
  const startedAt = Date.now();
  const key = buildGuideSearchCacheKey(params);
  const cached = await loadGuideSearchCache(key);
  if (cached) {
    await logGuideSearch(params, {
      provider: `${cached.response.provider}:cache`,
      resultCount: cached.response.items.length,
      hasMore: cached.response.hasMore,
      durationMs: Date.now() - startedAt,
      status: cached.response.items.length > 0 ? 'success' : 'empty',
      sourceName: cached.response.items[0]?.sourceName,
      sourceDomain: getSourceDomain(cached.response.items[0]?.sourceUrl),
    });
    return cached.response;
  }

  const provider = resolveGuideSearchProvider();
  try {
    const response = await provider.search(params);

    if (response.items.length > 0) {
      await saveGuideSearchCache({
        key,
        params,
        response,
        expiresAt: new Date(Date.now() + SEARCH_CACHE_TTL_MS).toISOString(),
      });
    }

    await logGuideSearch(params, {
      provider: response.provider,
      resultCount: response.items.length,
      hasMore: response.hasMore,
      durationMs: Date.now() - startedAt,
      status: response.items.length > 0 ? 'success' : 'empty',
      sourceName: response.items[0]?.sourceName,
      sourceDomain: getSourceDomain(response.items[0]?.sourceUrl),
    });

    return response;
  } catch (error) {
    await logGuideSearch(params, {
      provider: import.meta.env.VITE_GUIDE_SEARCH_PROVIDER === 'mock' ? 'mock' : 'remote',
      resultCount: 0,
      hasMore: false,
      durationMs: Date.now() - startedAt,
      status: 'error',
      errorCode: error instanceof Error ? error.message : 'guide-search-failed',
    });
    throw error;
  }
}
