import type {
  GuideDocument,
  GuideSearchResult,
  MarkerBudgetLevel,
  MarkerMood,
  MarkerTag,
  MarkerTransport,
  MarkerWeather,
  Scope,
  TripPlanningItem,
} from '../../../types';
import type { AccountRoleDto } from './common';
import type {
  GuideSearchStatusBreakdownDto,
  GuideSearchTrendPointDto,
  GuideSourceHealthDto,
} from './guides';

export interface AdminMarkerNodeDto {
  id: string;
  tripId?: string;
  scope: Scope;
  scopeId: string;
  scopeName: string;
  city: string;
  note: string;
  tags?: MarkerTag[];
  mood?: MarkerMood;
  weather?: MarkerWeather;
  transport?: MarkerTransport;
  budgetLevel?: MarkerBudgetLevel;
  images?: Array<{
    id: string;
    imageUrl: string;
    isFeatured: boolean;
    caption?: string;
    curatedSortOrder?: number;
  }>;
  imageUrls?: string[];
  visitedStartAt: string;
  visitedEndAt: string;
  createdAt: string;
}

export interface AdminTripNodeDto {
  id: string;
  name: string;
  coverImageUrl?: string;
  note: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

export interface AdminSavedGuideNodeDto {
  id: string;
  markerId?: string;
  keyword: string;
  result: GuideSearchResult | GuideDocument;
  savedAt: string;
}

export interface AdminGuideSearchHistoryNodeDto {
  id: string;
  keyword: string;
  scope: Scope | 'all';
  createdAt: string;
}

export interface AdminMarkerSearchEventNodeDto {
  id: string;
  companionId?: string;
  keyword: string;
  scope: Scope | 'all';
  year?: string;
  resultCount: number;
  page: number;
  pageSize: number;
  createdAt: string;
}

export interface AdminPlanningItemNodeDto extends TripPlanningItem {
  tripName: string;
}

export interface AdminCompanionNodeDto {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  markers: AdminMarkerNodeDto[];
  savedGuides: AdminSavedGuideNodeDto[];
  guideSearchHistory: AdminGuideSearchHistoryNodeDto[];
  planningItems?: AdminPlanningItemNodeDto[];
}

export interface AdminAccountNodeDto {
  id: string;
  name: string;
  username: string;
  role: AccountRoleDto;
  createdAt: string;
  trips: AdminTripNodeDto[];
  markerSearchEvents: AdminMarkerSearchEventNodeDto[];
  companions: AdminCompanionNodeDto[];
  stats: {
    tripCount: number;
    companionCount: number;
    markerCount: number;
    savedGuideCount: number;
    guideSearchHistoryCount: number;
    markerSearchEventCount: number;
    planningItemCount?: number;
    convertedPlanningItemCount?: number;
  };
}

export type AdminQualitySeverityDto = 'critical' | 'warning' | 'info';

export type AdminQualityIssueTypeDto =
  | 'marker_missing_photo'
  | 'marker_unassigned_trip'
  | 'trip_missing_cover'
  | 'photo_missing_caption'
  | 'planning_overdue'
  | 'saved_guide_unlinked'
  | 'guide_source_degraded'
  | 'guide_search_error_spike'
  | 'companion_memory_snapshot_stale';

export type AdminQualityNavigationKindDto =
  | 'tripDetail'
  | 'tripChecklist'
  | 'photoCuration'
  | 'companionMemories'
  | 'adminOnly';

export interface AdminQualityNavigationPayloadDto {
  tripId?: string;
  companionId?: string;
  year?: number;
  markerId?: string;
  photoId?: string;
  guideId?: string;
}

export interface AdminQualityAutoFixDto {
  repairable: boolean;
  label: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AdminQualityIssueDto {
  id: string;
  severity: AdminQualitySeverityDto;
  type: AdminQualityIssueTypeDto;
  title: string;
  description: string;
  accountId?: string;
  accountName?: string;
  targetKind: 'account' | 'trip' | 'marker' | 'photo' | 'guide' | 'planningItem' | 'guideSource' | 'snapshot';
  targetId?: string;
  targetLabel: string;
  detectedAt: string;
  suggestedAction: string;
  navigationKind: AdminQualityNavigationKindDto;
  navigationPayload?: AdminQualityNavigationPayloadDto;
  canNavigate: boolean;
  autoFix?: AdminQualityAutoFixDto;
}

export interface AdminQualitySummaryDto {
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  affectedAccountCount: number;
  checkedAt: string;
}

export interface AdminQualityReportDto {
  summary: AdminQualitySummaryDto;
  issues: AdminQualityIssueDto[];
}

export interface AdminOverviewResponseDto {
  accounts: AdminAccountNodeDto[];
  guideSearchTrends?: GuideSearchTrendPointDto[];
  guideSearchStatusBreakdown?: GuideSearchStatusBreakdownDto[];
  guideSourceHealth?: GuideSourceHealthDto[];
  quality?: AdminQualityReportDto;
  meta: {
    fetchedAt: string;
    accountCount: number;
  };
}

export type AdminAuditActionDto =
  | 'quality_issue_viewed'
  | 'quality_issue_context_copied'
  | 'quality_issue_navigated'
  | 'quality_issue_auto_fix_previewed'
  | 'quality_issue_auto_fixed'
  | 'quality_issue_list_filtered'
  | 'audit_trail_viewed';

export interface AdminAuditLogDto {
  id: string;
  adminAccountId: string;
  adminAccountName: string;
  action: AdminAuditActionDto;
  targetKind?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CreateAdminAuditLogInputDto {
  action: AdminAuditActionDto;
  targetKind?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export interface AdminAuditLogsResponseDto {
  logs: AdminAuditLogDto[];
}

export interface AdminQualityAutoFixChangeDto {
  field: string;
  before: string | null;
  after: string | null;
}

export interface AdminQualityAutoFixResultDto {
  issueId: string;
  issueType: AdminQualityIssueTypeDto;
  targetKind: AdminQualityIssueDto['targetKind'];
  targetId?: string;
  repairable: boolean;
  status: 'preview' | 'applied' | 'already_resolved' | 'not_repairable';
  title: string;
  description: string;
  changes: AdminQualityAutoFixChangeDto[];
  appliedAt?: string;
}
