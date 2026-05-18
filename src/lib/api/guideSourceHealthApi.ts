import { getResourceBaseUrl, httpClient } from './httpClient';
import type {
  GuideSourceHealthListResponseDto,
  GuideSourcePreferenceMutationResponseDto,
  UpdateGuideSourcePreferenceInputDto,
} from './types';

export async function fetchGuideSourceHealth(limit = 20) {
  return httpClient.get<GuideSourceHealthListResponseDto>(
    getResourceBaseUrl(),
    '/guide-source-health',
    { limit },
  );
}

export async function updateGuideSourcePreference(input: UpdateGuideSourcePreferenceInputDto) {
  return httpClient.patch<GuideSourcePreferenceMutationResponseDto>(
    getResourceBaseUrl(),
    '/guide-source-health/preferences',
    input,
  );
}
