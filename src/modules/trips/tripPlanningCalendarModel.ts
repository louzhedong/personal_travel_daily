import type { TripPlanningSchedule, WishlistItem } from '../../types';

export function buildTripPlanningCalendarStats(schedule: TripPlanningSchedule | null) {
  const days = schedule?.days ?? [];
  const scheduledCount = days.reduce((total, day) => total + day.items.length, 0);
  const checklistHintCount = days.reduce(
    (total, day) => total + day.checklistGroups.reduce((groupTotal, group) => groupTotal + group.itemCount, 0),
    0,
  );

  return {
    dayCount: days.length,
    scheduledCount,
    unscheduledCount: schedule?.unscheduledItems.length ?? 0,
    checklistHintCount,
  };
}

export function buildScheduleWishlistOptions(wishlistItems: WishlistItem[], usedWishlistIds: string[]) {
  const usedSet = new Set(usedWishlistIds);
  return wishlistItems
    .filter((item) => !usedSet.has(item.id))
    .map((item) => ({
      value: item.id,
      label: `${item.scopeName} · ${item.city}`,
    }));
}

export function collectScheduledWishlistIds(schedule: TripPlanningSchedule | null) {
  if (!schedule) {
    return [];
  }

  return [...schedule.days.flatMap((day) => day.items), ...schedule.unscheduledItems]
    .map((item) => item.sourceWishlistId)
    .filter((id): id is string => Boolean(id));
}
