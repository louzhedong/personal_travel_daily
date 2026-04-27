import type {
  AdminAccountNodeDto,
  AdminGuideSearchHistoryNodeDto,
  AdminMarkerNodeDto,
  AdminMarkerSearchEventNodeDto,
  AdminOverviewResponseDto,
  AdminSavedGuideNodeDto,
  AdminTripNodeDto,
} from '../../lib/api/types';

export type AdminDetailTab = 'trips' | 'markers' | 'savedGuides' | 'guideSearchHistory' | 'markerSearchEvents';

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

export interface AdminDetailCollections {
  trips: AdminTripDetailRow[];
  markers: AdminMarkerDetailRow[];
  savedGuides: AdminSavedGuideDetailRow[];
  guideSearchHistory: AdminGuideSearchHistoryDetailRow[];
  markerSearchEvents: AdminMarkerSearchEventDetailRow[];
}

// Keep tab metadata centralized for container/components parity.
// 统一维护标签页元数据，确保容器与子组件渲染完全一致。
export const ADMIN_DETAIL_TABS: AdminTabItem[] = [
  { key: 'trips', label: '行程' },
  { key: 'markers', label: '旅行记录' },
  { key: 'savedGuides', label: '收藏攻略' },
  { key: 'guideSearchHistory', label: '攻略搜索' },
  { key: 'markerSearchEvents', label: '记录搜索' },
];

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
    }),
    {
      accountCount: 0,
      tripCount: 0,
      companionCount: 0,
      markerCount: 0,
      savedGuideCount: 0,
      guideSearchHistoryCount: 0,
      markerSearchEventCount: 0,
    },
  );
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
