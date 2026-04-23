import { getResourceBaseUrl, httpClient } from './httpClient';
import type { AdminOverviewResponseDto } from './types';

const adminBaseUrl = getResourceBaseUrl();

export function fetchAdminOverview() {
  return httpClient.get<AdminOverviewResponseDto>(adminBaseUrl, '/admin/overview');
}
