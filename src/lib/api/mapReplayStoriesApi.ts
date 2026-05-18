import { getResourceBaseUrl, httpClient } from './httpClient';
import type { MapReplayStoryResponseDto } from './types';

const replayStoriesBaseUrl = getResourceBaseUrl();

export function fetchTripMapReplayStory(tripId: string) {
  return httpClient.get<MapReplayStoryResponseDto>(
    replayStoriesBaseUrl,
    `/map-replay-stories/trip/${encodeURIComponent(tripId)}`,
  );
}

export function fetchYearMapReplayStory(year: string) {
  return httpClient.get<MapReplayStoryResponseDto>(
    replayStoriesBaseUrl,
    `/map-replay-stories/year/${encodeURIComponent(year)}`,
  );
}

export function fetchCompanionMapReplayStory(companionId: string) {
  return httpClient.get<MapReplayStoryResponseDto>(
    replayStoriesBaseUrl,
    `/map-replay-stories/companion/${encodeURIComponent(companionId)}`,
  );
}
