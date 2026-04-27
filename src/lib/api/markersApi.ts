import { httpClient, getResourceBaseUrl } from './httpClient';
import type { TravelStore } from '../../types';
import type {
  BatchUpdateMarkersTripInput,
  CreateMarkerInput,
  MarkerSearchResponseDto,
  SearchMarkersQuery,
  UpdateMarkerInput,
} from './types';

export async function searchMarkers(query: SearchMarkersQuery) {
  return httpClient.get<MarkerSearchResponseDto>(getResourceBaseUrl(), '/markers/search', query);
}

export async function createMarker(input: CreateMarkerInput) {
  return httpClient.post<TravelStore>(getResourceBaseUrl(), '/markers', input);
}

export async function updateMarker(id: string, input: UpdateMarkerInput) {
  return httpClient.patch<TravelStore>(getResourceBaseUrl(), `/markers/${id}`, input);
}

export async function batchUpdateMarkersTrip(input: BatchUpdateMarkersTripInput) {
  return httpClient.patch<TravelStore>(getResourceBaseUrl(), '/markers/batch-trip', input);
}

export async function deleteMarker(id: string) {
  return httpClient.delete<TravelStore>(getResourceBaseUrl(), `/markers/${id}`);
}
