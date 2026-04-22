import { httpClient, getResourceBaseUrl } from './httpClient';
import type {
  CreateSavedGuideInput,
  DeleteSavedGuideResponseDto,
  ListSavedGuidesQuery,
  SavedGuideListResponseDto,
  SavedGuideMutationResponseDto,
} from './types';

export async function fetchSavedGuides(query?: ListSavedGuidesQuery) {
  return httpClient.get<SavedGuideListResponseDto>(getResourceBaseUrl(), '/saved-guides', query);
}

export async function createSavedGuide(input: CreateSavedGuideInput) {
  return httpClient.post<SavedGuideMutationResponseDto>(getResourceBaseUrl(), '/saved-guides', input);
}

export async function deleteSavedGuide(id: string) {
  return httpClient.delete<DeleteSavedGuideResponseDto>(getResourceBaseUrl(), `/saved-guides/${id}`);
}
