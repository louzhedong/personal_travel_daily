import type { AdminQualityIssueDto } from './admin.js';

export type ReminderTypeDto =
  | 'planning_overdue'
  | 'trip_missing_cover'
  | 'photo_missing_caption'
  | 'anomalous_login'
  | 'guide_source_degraded'
  | 'guide_search_error_spike'
  | 'companion_memory_snapshot_stale';

export type ReminderSeverityDto = 'critical' | 'warning' | 'info';
export type ReminderStatusDto = 'open' | 'resolved';

export interface ReminderNavigationDto {
  kind: AdminQualityIssueDto['navigationKind'] | 'settings';
  path?: string;
  canNavigate: boolean;
  payload?: Record<string, string | number | undefined>;
}

export interface ReminderDto {
  id: string;
  fingerprint: string;
  type: ReminderTypeDto;
  severity: ReminderSeverityDto;
  title: string;
  description: string;
  targetKind: string;
  targetId?: string;
  targetLabel: string;
  detectedAt: string;
  suggestedAction: string;
  navigation: ReminderNavigationDto;
  status: ReminderStatusDto;
  resolvedAt?: string;
  mutedUntil?: string;
  typeMutedUntil?: string;
}

export interface ReminderPreferenceDto {
  type: ReminderTypeDto;
  enabled: boolean;
  mutedUntil?: string;
}

export interface ReminderSummaryDto {
  totalCount: number;
  activeCount: number;
  mutedCount: number;
  resolvedCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}

export interface ReminderListResponseDto {
  reminders: ReminderDto[];
  preferences: ReminderPreferenceDto[];
  summary: ReminderSummaryDto;
  generatedAt: string;
}

export interface ReminderAdminTrendDto {
  type: ReminderTypeDto;
  label: string;
  totalCount: number;
  activeCount: number;
  mutedCount: number;
  resolvedCount: number;
  criticalCount: number;
  accountCount: number;
}

export interface ReminderAdminTrendsResponseDto {
  trends: ReminderAdminTrendDto[];
  generatedAt: string;
}

export interface ReminderActionResponseDto {
  success: true;
  reminder?: ReminderDto;
  preference?: ReminderPreferenceDto;
}
