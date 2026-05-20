import { getResourceBaseUrl, httpClient } from './httpClient';
import type { AssistantPreferenceResponseDto, AssistantSuggestionListResponseDto, AssistantSuggestionResponseDto, ConfirmAssistantSuggestionInputDto, CreateAssistantSuggestionInputDto, UpdateAssistantPreferenceInputDto } from './types';

const baseUrl = getResourceBaseUrl();

export function fetchAssistantPreference() {
  return httpClient.get<AssistantPreferenceResponseDto>(baseUrl, '/assistant/preference');
}

export function updateAssistantPreference(input: UpdateAssistantPreferenceInputDto) {
  return httpClient.patch<AssistantPreferenceResponseDto>(baseUrl, '/assistant/preference', input);
}

export function createAssistantSuggestion(input: CreateAssistantSuggestionInputDto) {
  return httpClient.post<AssistantSuggestionResponseDto>(baseUrl, '/assistant/suggestions', input);
}

export function fetchAssistantSuggestions() {
  return httpClient.get<AssistantSuggestionListResponseDto>(baseUrl, '/assistant/suggestions');
}

export function confirmAssistantSuggestion(id: string, input: ConfirmAssistantSuggestionInputDto = {}) {
  return httpClient.post<AssistantSuggestionResponseDto>(baseUrl, `/assistant/suggestions/${encodeURIComponent(id)}/confirm`, input);
}

export function dismissAssistantSuggestion(id: string) {
  return httpClient.post<AssistantSuggestionResponseDto>(baseUrl, `/assistant/suggestions/${encodeURIComponent(id)}/dismiss`);
}
