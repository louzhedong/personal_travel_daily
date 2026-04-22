import { httpClient, getResourceBaseUrl } from './httpClient';
import type { CreateCompanionInput, UpdateCompanionInput } from './types';
import type { TravelStore } from '../../types';

export async function createCompanion(input: CreateCompanionInput) {
  return httpClient.post<TravelStore>(getResourceBaseUrl(), '/companions', input);
}

export async function updateCompanion(id: string, input: UpdateCompanionInput) {
  return httpClient.patch<TravelStore>(getResourceBaseUrl(), `/companions/${id}`, input);
}
