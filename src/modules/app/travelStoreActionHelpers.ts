import type { GuideSearchHistoryItem, TravelStore } from '../../types';

export function keepCurrentActiveUser(nextStore: TravelStore, current: TravelStore) {
  return {
    ...nextStore,
    activeUserId: current.activeUserId,
  };
}

export function getActionErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function upsertRecentSearchHistory(
  history: GuideSearchHistoryItem[],
  item: GuideSearchHistoryItem,
  limit = 6,
) {
  const remaining = history.filter(
    (current) =>
      !(
        current.scope === item.scope &&
        current.keyword.trim().toLowerCase() === item.keyword.trim().toLowerCase()
      ),
  );

  return [item, ...remaining].slice(0, limit);
}
