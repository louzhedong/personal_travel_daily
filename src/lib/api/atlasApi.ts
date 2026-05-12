import { getResourceBaseUrl, httpClient } from './httpClient';
import type { AtlasTimelineQueryDto, AtlasTimelineResponseDto } from './types';

const atlasBaseUrl = getResourceBaseUrl();

export function fetchAtlasTimeline(query: Partial<AtlasTimelineQueryDto> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== 'all') {
      params.set(key, String(value));
    }
  });
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return httpClient.get<AtlasTimelineResponseDto>(atlasBaseUrl, `/atlas/timeline${suffix}`);
}
