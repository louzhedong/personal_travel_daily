import { getResourceBaseUrl, httpClient } from './httpClient';
import type {
  MemoryCapsuleDetailResponseDto,
  MemoryCapsuleListResponseDto,
  MemoryCapsuleConfigDto,
  MemoryCapsuleStatusDto,
  MemoryCapsuleTemplateDto,
  MemoryCapsuleTypeDto,
} from './types';

const memoryCapsulesBaseUrl = getResourceBaseUrl();

export interface CreateMemoryCapsuleInput {
  type: MemoryCapsuleTypeDto;
  targetId: string;
  title?: string;
  subtitle?: string;
  template?: MemoryCapsuleTemplateDto;
}

export interface UpdateMemoryCapsuleInput {
  title?: string;
  subtitle?: string | null;
  template?: MemoryCapsuleTemplateDto;
  status?: Exclude<MemoryCapsuleStatusDto, 'archived'>;
  config?: MemoryCapsuleConfigDto;
}

export function listMemoryCapsules(includeArchived = false) {
  const suffix = includeArchived ? '?includeArchived=true' : '';
  return httpClient.get<MemoryCapsuleListResponseDto>(memoryCapsulesBaseUrl, `/memory-capsules${suffix}`);
}

export function createMemoryCapsule(input: CreateMemoryCapsuleInput) {
  return httpClient.post<MemoryCapsuleDetailResponseDto>(memoryCapsulesBaseUrl, '/memory-capsules', input);
}

export function fetchMemoryCapsule(capsuleId: string) {
  return httpClient.get<MemoryCapsuleDetailResponseDto>(
    memoryCapsulesBaseUrl,
    `/memory-capsules/${encodeURIComponent(capsuleId)}`,
  );
}

export function updateMemoryCapsule(capsuleId: string, input: UpdateMemoryCapsuleInput) {
  return httpClient.patch<MemoryCapsuleDetailResponseDto>(
    memoryCapsulesBaseUrl,
    `/memory-capsules/${encodeURIComponent(capsuleId)}`,
    input,
  );
}

export function duplicateMemoryCapsule(capsuleId: string) {
  return httpClient.post<MemoryCapsuleDetailResponseDto>(
    memoryCapsulesBaseUrl,
    `/memory-capsules/${encodeURIComponent(capsuleId)}/duplicate`,
    {},
  );
}

export function archiveMemoryCapsule(capsuleId: string) {
  return httpClient.post<{ success: true }>(
    memoryCapsulesBaseUrl,
    `/memory-capsules/${encodeURIComponent(capsuleId)}/archive`,
    {},
  );
}
