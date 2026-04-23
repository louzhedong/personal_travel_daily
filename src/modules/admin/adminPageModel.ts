import type {
  AdminAccountNodeDto,
  AdminOverviewResponseDto,
} from '../../lib/api/types';

export type AdminDetailTab = 'trips' | 'markers' | 'savedGuides' | 'guideSearchHistory';

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
    }),
    {
      accountCount: 0,
      tripCount: 0,
      companionCount: 0,
      markerCount: 0,
      savedGuideCount: 0,
      guideSearchHistoryCount: 0,
    },
  );
}

export function getAccountDetailCollections(account: AdminAccountNodeDto) {
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
  };
}
