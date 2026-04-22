import { httpClient, getResourceBaseUrl } from './httpClient';
import type {
  CreateGuideSearchHistoryInput,
  GuideSearchHistoryListResponseDto,
  GuideSearchHistoryMutationResponseDto,
  ListGuideSearchHistoriesQuery,
} from './types';

export async function fetchGuideSearchHistories(query?: ListGuideSearchHistoriesQuery) {
  return httpClient.get<GuideSearchHistoryListResponseDto>(
    getResourceBaseUrl(),
    '/guide-search-histories',
    query,
  );
}

export async function createGuideSearchHistory(input: CreateGuideSearchHistoryInput) {
  return httpClient.post<GuideSearchHistoryMutationResponseDto>(
    getResourceBaseUrl(),
    '/guide-search-histories',
    input,
  );
}
