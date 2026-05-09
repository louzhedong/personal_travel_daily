import type {
  AdminAccountNodeDto,
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
