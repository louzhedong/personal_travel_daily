import type {
  AdminAccountNodeDto,
  AdminAuditActionDto,
  AdminAuditLogDto,
  AdminGuideSearchHistoryNodeDto,
  AdminMarkerNodeDto,
  AdminMarkerSearchEventNodeDto,
  AdminOverviewResponseDto,
  AdminPlanningItemNodeDto,
  AdminQualityIssueDto,
  AdminQualityIssueTypeDto,
  AdminQualitySeverityDto,
  AdminSavedGuideNodeDto,
  AdminTripNodeDto,
} from '../../lib/api/types';

export type AdminDetailTab = 'trips' | 'markers' | 'planningItems' | 'savedGuides' | 'guideSearchHistory' | 'markerSearchEvents';

export interface AdminTabItem {
  key: AdminDetailTab;
  label: string;
}

export type AdminTripDetailRow = AdminTripNodeDto & { markerCount: number };
export type AdminMarkerDetailRow = AdminMarkerNodeDto & {
  companionName: string;
  tripName: string;
};
export type AdminSavedGuideDetailRow = AdminSavedGuideNodeDto & { companionName: string };
export type AdminGuideSearchHistoryDetailRow = AdminGuideSearchHistoryNodeDto & {
  companionName: string;
};
export type AdminMarkerSearchEventDetailRow = AdminMarkerSearchEventNodeDto & {
  companionName: string;
};
export type AdminPlanningItemDetailRow = AdminPlanningItemNodeDto & { companionName: string };

export type AdminQualitySeverityFilter = AdminQualitySeverityDto | 'all';
export type AdminQualityTypeFilter = AdminQualityIssueTypeDto | 'all';

export interface AdminQualityFilters {
  severity: AdminQualitySeverityFilter;
  type: AdminQualityTypeFilter;
  accountId: string;
  keyword: string;
}

export interface AdminQualityNavigationTarget {
  label: string;
  path: string;
}

export interface AdminDetailCollections {
  trips: AdminTripDetailRow[];
  markers: AdminMarkerDetailRow[];
  planningItems: AdminPlanningItemDetailRow[];
  savedGuides: AdminSavedGuideDetailRow[];
  guideSearchHistory: AdminGuideSearchHistoryDetailRow[];
  markerSearchEvents: AdminMarkerSearchEventDetailRow[];
}

// Keep tab metadata centralized for container/components parity.
// 统一维护标签页元数据，确保容器与子组件渲染完全一致。
export const ADMIN_DETAIL_TABS: AdminTabItem[] = [
  { key: 'trips', label: '行程' },
  { key: 'markers', label: '旅行记录' },
  { key: 'planningItems', label: '行前规划' },
  { key: 'savedGuides', label: '收藏攻略' },
  { key: 'guideSearchHistory', label: '攻略搜索' },
  { key: 'markerSearchEvents', label: '记录搜索' },
];

export const ADMIN_QUALITY_SEVERITY_LABELS: Record<AdminQualitySeverityDto, string> = {
  critical: '严重',
  warning: '注意',
  info: '建议',
};

export const ADMIN_QUALITY_TYPE_LABELS: Record<AdminQualityIssueTypeDto, string> = {
  marker_missing_photo: '记录缺图',
  marker_unassigned_trip: '未归行程',
  trip_missing_cover: '行程缺封面',
  photo_missing_caption: '照片缺说明',
  planning_overdue: '规划过期',
  saved_guide_unlinked: '攻略未关联',
  guide_source_degraded: '来源异常',
  guide_search_error_spike: '搜索失败升高',
  companion_memory_snapshot_stale: '回忆快照过期',
};

export const ADMIN_AUDIT_ACTION_LABELS: Record<AdminAuditActionDto, string> = {
  quality_issue_viewed: '查看问题',
  quality_issue_context_copied: '复制上下文',
  quality_issue_navigated: '定位问题',
  quality_issue_auto_fix_previewed: '预览修复',
  quality_issue_auto_fixed: '自动修复',
  quality_issue_list_filtered: '筛选问题',
  audit_trail_viewed: '查看审计',
};

export const DEFAULT_ADMIN_QUALITY_FILTERS: AdminQualityFilters = {
  severity: 'all',
  type: 'all',
  accountId: 'all',
  keyword: '',
};

export function formatAdminDate(value: string) {
  try {
    return new Date(value).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

export function formatAdminDateOnly(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return value;
  }
}

export function formatAdminScope(value: 'all' | 'domestic' | 'international') {
  if (value === 'all') {
    return '全部';
  }

  return value === 'domestic' ? '国内' : '国际';
}

export function getAdminSummary(overview: AdminOverviewResponseDto) {
  return overview.accounts.reduce(
    (acc, account) => ({
      accountCount: acc.accountCount + 1,
      tripCount: acc.tripCount + account.stats.tripCount,
      companionCount: acc.companionCount + account.stats.companionCount,
      markerCount: acc.markerCount + account.stats.markerCount,
      savedGuideCount: acc.savedGuideCount + account.stats.savedGuideCount,
      guideSearchHistoryCount:
        acc.guideSearchHistoryCount + account.stats.guideSearchHistoryCount,
      markerSearchEventCount: acc.markerSearchEventCount + account.stats.markerSearchEventCount,
      planningItemCount: acc.planningItemCount + (account.stats.planningItemCount ?? 0),
      convertedPlanningItemCount:
        acc.convertedPlanningItemCount + (account.stats.convertedPlanningItemCount ?? 0),
    }),
    {
      accountCount: 0,
      tripCount: 0,
      companionCount: 0,
      markerCount: 0,
      savedGuideCount: 0,
      guideSearchHistoryCount: 0,
      markerSearchEventCount: 0,
      planningItemCount: 0,
      convertedPlanningItemCount: 0,
    },
  );
}

export function getTopQualityIssues(overview: AdminOverviewResponseDto, limit = 8): AdminQualityIssueDto[] {
  return (overview.quality?.issues ?? []).slice(0, limit);
}

export function getAccountQualityIssues(
  overview: AdminOverviewResponseDto,
  accountId: string,
  limit = 5,
): AdminQualityIssueDto[] {
  return (overview.quality?.issues ?? [])
    .filter((issue) => issue.accountId === accountId)
    .slice(0, limit);
}

export function filterAdminQualityIssues(
  issues: AdminQualityIssueDto[],
  filters: AdminQualityFilters,
): AdminQualityIssueDto[] {
  const keyword = filters.keyword.trim().toLowerCase();

  return issues.filter((issue) => {
    if (filters.severity !== 'all' && issue.severity !== filters.severity) {
      return false;
    }
    if (filters.type !== 'all' && issue.type !== filters.type) {
      return false;
    }
    if (filters.accountId !== 'all' && issue.accountId !== filters.accountId) {
      return false;
    }
    if (!keyword) {
      return true;
    }

    const haystack = [
      issue.title,
      issue.description,
      issue.accountName,
      issue.targetLabel,
      issue.suggestedAction,
      ADMIN_QUALITY_TYPE_LABELS[issue.type],
      ADMIN_QUALITY_SEVERITY_LABELS[issue.severity],
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(keyword);
  });
}

export function getAdminQualityFilterSummary(totalCount: number, filteredCount: number) {
  if (totalCount === filteredCount) {
    return `全部 ${totalCount} 个问题`;
  }

  return `筛选出 ${filteredCount} / ${totalCount} 个问题`;
}

export function buildAdminQualityNavigationTarget(
  issue: AdminQualityIssueDto,
): AdminQualityNavigationTarget | undefined {
  const payload = issue.navigationPayload ?? {};

  if (!issue.canNavigate) {
    return undefined;
  }

  if (issue.navigationKind === 'tripDetail' && payload.tripId) {
    return {
      label: '打开行程',
      path: `/trips/${encodeURIComponent(payload.tripId)}`,
    };
  }

  if (issue.navigationKind === 'tripChecklist' && payload.tripId) {
    return {
      label: '打开规划',
      path: `/trips/${encodeURIComponent(payload.tripId)}/checklist`,
    };
  }

  if (issue.navigationKind === 'photoCuration') {
    const params = new URLSearchParams();
    if (payload.tripId) {
      params.set('tripId', payload.tripId);
    }
    if (payload.companionId) {
      params.set('companionId', payload.companionId);
    }
    if (payload.year) {
      params.set('year', String(payload.year));
    }
    const query = params.toString();
    return {
      label: '打开影像',
      path: query ? `/photos?${query}` : '/photos',
    };
  }

  if (issue.navigationKind === 'companionMemories' && payload.companionId) {
    return {
      label: '打开回忆',
      path: `/companions/${encodeURIComponent(payload.companionId)}/memories`,
    };
  }

  return undefined;
}

export function serializeQualityIssueContext(issue: AdminQualityIssueDto) {
  return [
    `问题：${issue.title}`,
    `类型：${ADMIN_QUALITY_TYPE_LABELS[issue.type]}`,
    `严重程度：${ADMIN_QUALITY_SEVERITY_LABELS[issue.severity]}`,
    issue.accountName ? `账号：${issue.accountName}` : undefined,
    `目标：${issue.targetLabel}`,
    `检测时间：${formatAdminDate(issue.detectedAt)}`,
    `建议：${issue.suggestedAction}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function getAdminQualityReminder(overview: AdminOverviewResponseDto) {
  const summary = overview.quality?.summary;
  if (!summary) {
    return {
      tone: 'neutral' as const,
      title: '暂无质量提醒',
      description: '等待下一次后台巡检结果。',
    };
  }

  const checkedAt = new Date(summary.checkedAt);
  const stale = Number.isFinite(checkedAt.getTime()) && Date.now() - checkedAt.getTime() > 24 * 60 * 60 * 1000;

  if (stale) {
    return {
      tone: 'warning' as const,
      title: '巡检结果可能过期',
      description: '建议刷新后台页面获取最新质量状态。',
    };
  }

  if (summary.criticalCount > 0) {
    return {
      tone: 'critical' as const,
      title: '存在严重问题',
      description: `${summary.criticalCount} 个严重问题需要优先定位。`,
    };
  }

  if (summary.warningCount > 0) {
    return {
      tone: 'warning' as const,
      title: '存在待处理问题',
      description: `${summary.warningCount} 个注意项建议持续跟进。`,
    };
  }

  return {
    tone: 'neutral' as const,
    title: '暂无质量提醒',
    description: '当前没有严重或注意级质量问题。',
  };
}

export function formatAdminAuditAction(action: AdminAuditActionDto) {
  return ADMIN_AUDIT_ACTION_LABELS[action] ?? action;
}

export function filterAdminAuditLogs(logs: AdminAuditLogDto[], action: AdminAuditActionDto | 'all') {
  if (action === 'all') {
    return logs;
  }

  return logs.filter((log) => log.action === action);
}

export function getAccountDetailCollections(account: AdminAccountNodeDto): AdminDetailCollections {
  const companions = account.companions;
  const tripById = new Map(account.trips.map((trip) => [trip.id, trip]));
  const markerCountByTripId = new Map<string, number>();
  const markers = companions.flatMap((companion) =>
    companion.markers.map((marker) => {
      if (marker.tripId) {
        markerCountByTripId.set(marker.tripId, (markerCountByTripId.get(marker.tripId) ?? 0) + 1);
      }

      return {
        ...marker,
        companionName: companion.name,
        tripName: marker.tripId ? tripById.get(marker.tripId)?.name ?? '未知行程' : '未归入行程',
      };
    }),
  );

  return {
    trips: account.trips.map((trip) => ({
      ...trip,
      markerCount: markerCountByTripId.get(trip.id) ?? 0,
    })),
    markers,
    planningItems: companions.flatMap((companion) =>
      (companion.planningItems ?? []).map((item) => ({
        ...item,
        companionName: companion.name,
      })),
    ),
    savedGuides: companions.flatMap((companion) =>
      companion.savedGuides.map((guide) => ({
        ...guide,
        companionName: companion.name,
      })),
    ),
    guideSearchHistory: companions.flatMap((companion) =>
      companion.guideSearchHistory.map((history) => ({
        ...history,
        companionName: companion.name,
      })),
    ),
    markerSearchEvents: account.markerSearchEvents.map((event) => ({
      ...event,
      companionName: event.companionId
        ? companions.find((companion) => companion.id === event.companionId)?.name ?? '未知同行人'
        : '全部同行人',
    })),
  };
}
