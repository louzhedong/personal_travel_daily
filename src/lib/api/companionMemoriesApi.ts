import { getResourceBaseUrl, httpClient } from './httpClient';
import type { CompanionMemoryResponseDto } from './types';

export function fetchCompanionMemory(companionId: string) {
  return httpClient.get<CompanionMemoryResponseDto>(
    getResourceBaseUrl(),
    `/companions/${encodeURIComponent(companionId)}/memories`,
  );
}

export function refreshCompanionMemory(companionId: string) {
  return httpClient.post<CompanionMemoryResponseDto>(
    getResourceBaseUrl(),
    `/companions/${encodeURIComponent(companionId)}/memories/refresh`,
    {},
  );
}
