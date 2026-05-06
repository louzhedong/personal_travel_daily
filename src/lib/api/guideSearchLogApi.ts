import { getResourceBaseUrl, httpClient } from './httpClient';
import type {
  CreateGuideSearchLogInput,
  GuideSearchLogMutationResponseDto,
} from './types';

export async function createGuideSearchLog(input: CreateGuideSearchLogInput) {
  return httpClient.post<GuideSearchLogMutationResponseDto>(
    getResourceBaseUrl(),
    '/guide-search-logs',
    input,
  );
}
