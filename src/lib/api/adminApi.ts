import { getResourceBaseUrl, httpClient } from './httpClient';
import type {
  AdminAuditActionDto,
  AdminAuditLogDto,
  AdminAuditLogsResponseDto,
  AdminOverviewResponseDto,
  CreateAdminAuditLogInputDto,
} from './types';

const adminBaseUrl = getResourceBaseUrl();

export function fetchAdminOverview() {
  return httpClient.get<AdminOverviewResponseDto>(adminBaseUrl, '/admin/overview');
}

export interface FetchAdminAuditLogsQuery {
  action?: AdminAuditActionDto;
  targetKind?: string;
  limit?: number;
}

function buildAuditLogsPath(query: FetchAdminAuditLogsQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  });
  const queryString = params.toString();
  return queryString ? `/admin/audit-logs?${queryString}` : '/admin/audit-logs';
}

export function fetchAdminAuditLogs(query: FetchAdminAuditLogsQuery = {}) {
  return httpClient.get<AdminAuditLogsResponseDto>(adminBaseUrl, buildAuditLogsPath(query));
}

export function recordAdminAuditLog(input: CreateAdminAuditLogInputDto) {
  return httpClient.post<AdminAuditLogDto>(adminBaseUrl, '/admin/audit-logs', input);
}
