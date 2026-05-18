import { getResourceBaseUrl, httpClient } from './httpClient';
import type {
  CreateMarkerTagVocabularyInputDto,
  MarkerTagVocabularyResponseDto,
  UpdateMarkerTagVocabularyInputDto,
} from './types';

const tagVocabularyBaseUrl = getResourceBaseUrl();

export function fetchMarkerTagVocabulary() {
  return httpClient.get<MarkerTagVocabularyResponseDto>(tagVocabularyBaseUrl, '/marker-tags/vocabulary');
}

export function createMarkerTagVocabulary(input: CreateMarkerTagVocabularyInputDto) {
  return httpClient.post<MarkerTagVocabularyResponseDto>(tagVocabularyBaseUrl, '/marker-tags/vocabulary', input);
}

export function updateMarkerTagVocabulary(value: string, input: UpdateMarkerTagVocabularyInputDto) {
  return httpClient.patch<MarkerTagVocabularyResponseDto>(
    tagVocabularyBaseUrl,
    `/marker-tags/vocabulary/${encodeURIComponent(value)}`,
    input,
  );
}

export function deleteMarkerTagVocabulary(value: string) {
  return httpClient.delete<MarkerTagVocabularyResponseDto>(
    tagVocabularyBaseUrl,
    `/marker-tags/vocabulary/${encodeURIComponent(value)}`,
  );
}
