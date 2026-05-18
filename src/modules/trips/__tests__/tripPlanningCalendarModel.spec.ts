import { describe, expect, it } from 'vitest';
import {
  buildScheduleWishlistOptions,
  buildTripPlanningCalendarStats,
  collectScheduledWishlistIds,
} from '../tripPlanningCalendarModel';
import type { TripPlanningSchedule, WishlistItem } from '../../../types';

const schedule: TripPlanningSchedule = {
  summary: { total: 2, plannedCount: 2, convertedCount: 0, highPriorityCount: 1 },
  days: [
    {
      date: '2026-05-01',
      dayIndex: 1,
      title: 'Day 1',
      items: [
        {
          id: 'plan-1',
          tripId: 'trip-1',
          companionId: 'user-alice',
          companionName: '小悠',
          companionColor: '#2563eb',
          title: '岚山竹林',
          scope: 'international',
          scopeId: 'japan',
          scopeName: '日本',
          city: '京都',
          priority: 'high',
          plannedDate: '2026-05-01',
          status: 'planned',
          sourceWishlistId: 'wishlist-1',
          sortOrder: 0,
          createdAt: '2026-05-01T00:00:00.000Z',
          updatedAt: '2026-05-01T00:00:00.000Z',
        },
      ],
      checklistGroups: [
        {
          stage: 'pre_departure',
          title: '出发前准备',
          description: '准备事项',
          itemCount: 2,
          items: [],
        },
      ],
    },
  ],
  unscheduledItems: [
    {
      id: 'plan-2',
      tripId: 'trip-1',
      companionId: 'user-alice',
      companionName: '小悠',
      companionColor: '#2563eb',
      title: '鸭川散步',
      scope: 'international',
      scopeId: 'japan',
      scopeName: '日本',
      city: '京都',
      priority: 'medium',
      status: 'planned',
      sortOrder: 1,
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
    },
  ],
  checklistGroups: [],
};

const wishlistItems: WishlistItem[] = [
  {
    id: 'wishlist-1',
    companionId: 'user-alice',
    companionName: '小悠',
    companionColor: '#2563eb',
    title: '岚山竹林',
    scope: 'international',
    scopeId: 'japan',
    scopeName: '日本',
    city: '京都',
    priority: 'high',
    importedTrips: [],
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 'wishlist-2',
    companionId: 'user-alice',
    companionName: '小悠',
    companionColor: '#2563eb',
    title: '伏见稻荷',
    scope: 'international',
    scopeId: 'japan',
    scopeName: '日本',
    city: '京都',
    priority: 'medium',
    importedTrips: [],
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
];

describe('tripPlanningCalendarModel', () => {
  it('builds schedule stats from days and unscheduled items', () => {
    expect(buildTripPlanningCalendarStats(schedule)).toEqual({
      dayCount: 1,
      scheduledCount: 1,
      unscheduledCount: 1,
      checklistHintCount: 2,
    });
  });

  it('filters wishlist options already imported into planning', () => {
    expect(collectScheduledWishlistIds(schedule)).toEqual(['wishlist-1']);
    expect(buildScheduleWishlistOptions(wishlistItems, ['wishlist-1'])).toEqual([
      { value: 'wishlist-2', label: '日本 · 京都' },
    ]);
  });
});
