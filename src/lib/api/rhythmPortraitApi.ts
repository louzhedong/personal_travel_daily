import { httpClient, getResourceBaseUrl } from './httpClient';
import type {
  RhythmPortraitActionResponseDto,
  RhythmPortraitDto,
} from './dto/rhythmPortrait';

/**
 * G5 · Travel Rhythm Portrait API client / 旅行节奏画像 API 客户端
 */
export async function fetchRhythmPortrait() {
  return httpClient.get<RhythmPortraitDto>(getResourceBaseUrl(), '/rhythm-portrait');
}

export async function refreshRhythmPortrait() {
  return httpClient.post<RhythmPortraitActionResponseDto>(
    getResourceBaseUrl(),
    '/rhythm-portrait/refresh',
    {},
  );
}

export function buildRhythmPortraitShareCardUrl() {
  return `${getResourceBaseUrl()}/rhythm-portrait/share-card.svg`;
}
