import { getResourceBaseUrl, httpClient } from './httpClient';
import type { HomeDashboardResponseDto, UpdateHomeDashboardPreferenceInputDto } from './types';

const baseUrl = getResourceBaseUrl();

export function fetchHomeDashboard() {
  return httpClient.get<HomeDashboardResponseDto>(baseUrl, '/home/dashboard');
}

export function updateHomeDashboardPreference(input: UpdateHomeDashboardPreferenceInputDto) {
  return httpClient.patch<HomeDashboardResponseDto>(baseUrl, '/home/dashboard/preference', input);
}
