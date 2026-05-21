import { getResourceBaseUrl, httpClient } from './httpClient';
import type { JourneyTimelineResponseDto } from './types';

const baseUrl = getResourceBaseUrl();

export function fetchJourneyTimeline(bucket: 'quarter' | 'half' = 'quarter') {
  return httpClient.get<JourneyTimelineResponseDto>(baseUrl, '/journey', { bucket });
}
