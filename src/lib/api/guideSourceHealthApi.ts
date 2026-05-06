import { getResourceBaseUrl, httpClient } from './httpClient';
import type { GuideSourceHealthListResponseDto } from './types';

export async function fetchGuideSourceHealth(limit = 20) {
  return httpClient.get<GuideSourceHealthListResponseDto>(
    getResourceBaseUrl(),
    '/guide-source-health',
    { limit },
  );
}
