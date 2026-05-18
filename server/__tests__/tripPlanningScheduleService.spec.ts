// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPrismaClientMock: vi.fn(),
  findActiveTripByIdMock: vi.fn(),
  listActiveTripPlanningItemsByTripIdMock: vi.fn(),
  findActiveTripPlanningItemByIdMock: vi.fn(),
  updateTripPlanningItemMock: vi.fn(),
  getNextTripPlanningSortOrderMock: vi.fn(),
  createTripPlanningItemMock: vi.fn(),
  listActiveTripChecklistItemsByTripIdMock: vi.fn(),
  findActiveWishlistItemByIdMock: vi.fn(),
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

vi.mock('../appApi/repositories/tripRepository.js', () => ({
  findActiveTripById: mocks.findActiveTripByIdMock,
}));

vi.mock('../appApi/repositories/tripPlanningRepository.js', () => ({
  listActiveTripPlanningItemsByTripId: mocks.listActiveTripPlanningItemsByTripIdMock,
  findActiveTripPlanningItemById: mocks.findActiveTripPlanningItemByIdMock,
  updateTripPlanningItem: mocks.updateTripPlanningItemMock,
  getNextTripPlanningSortOrder: mocks.getNextTripPlanningSortOrderMock,
  createTripPlanningItem: mocks.createTripPlanningItemMock,
}));

vi.mock('../appApi/repositories/tripChecklistRepository.js', () => ({
  listActiveTripChecklistItemsByTripId: mocks.listActiveTripChecklistItemsByTripIdMock,
}));

vi.mock('../appApi/repositories/wishlistRepository.js', () => ({
  findActiveWishlistItemById: mocks.findActiveWishlistItemByIdMock,
}));

import {
  getTripPlanningSchedule,
  importWishlistItemsToTripPlanningSchedule,
  updateTripPlanningItemSchedule,
} from '../appApi/services/tripPlanningScheduleService.js';

const companion = {
  id: 'user-alice',
  accountId: 'acct-1',
  name: '小悠',
  color: '#2563eb',
  sortOrder: 0,
  isDeleted: false,
  createdAt: new Date('2026-04-20T00:00:00.000Z'),
  updatedAt: new Date('2026-04-20T00:00:00.000Z'),
  deletedAt: null,
};

const planningItem = {
  id: 'plan-1',
  accountId: 'acct-1',
  tripId: 'trip-1',
  createdByCompanionId: 'user-alice',
  title: '岚山竹林',
  scope: 'international' as const,
  scopeId: 'japan',
  scopeName: '日本',
  city: '京都',
  note: '上午去',
  priority: 'high' as const,
  plannedDate: new Date('2026-05-02T00:00:00.000Z'),
  status: 'planned' as const,
  convertedMarkerId: null,
  sourceGuideIdentity: null,
  sourceGuideTitle: null,
  sourceGuideSourceName: null,
  sourceGuideSourceUrl: null,
  sourceWishlistId: null,
  sortOrder: 0,
  isDeleted: false,
  createdAt: new Date('2026-05-01T00:00:00.000Z'),
  updatedAt: new Date('2026-05-01T00:00:00.000Z'),
  deletedAt: null,
  createdByCompanion: companion,
};

describe('tripPlanningScheduleService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: (callback: (tx: object) => unknown) => callback({}),
    });
    mocks.findActiveTripByIdMock.mockResolvedValue({
      id: 'trip-1',
      accountId: 'acct-1',
      name: '京都春日行',
      startsAt: new Date('2026-05-01T00:00:00.000Z'),
      endsAt: new Date('2026-05-03T00:00:00.000Z'),
    });
    mocks.listActiveTripPlanningItemsByTripIdMock.mockResolvedValue([planningItem]);
    mocks.findActiveTripPlanningItemByIdMock.mockResolvedValue(planningItem);
    mocks.listActiveTripChecklistItemsByTripIdMock.mockResolvedValue([]);
    mocks.getNextTripPlanningSortOrderMock.mockResolvedValue(2);
    mocks.findActiveWishlistItemByIdMock.mockResolvedValue({
      id: 'wishlist-1',
      accountId: 'acct-1',
      createdByCompanionId: 'user-alice',
      title: '鸭川散步',
      scope: 'international',
      scopeId: 'japan',
      scopeName: '日本',
      city: '京都',
      note: null,
      priority: 'medium',
      sourceGuideIdentity: null,
      sourceGuideTitle: null,
      sourceGuideSourceName: null,
      sourceGuideSourceUrl: null,
    });
  });

  it('groups planning items by trip dates and keeps an unscheduled pool', async () => {
    mocks.listActiveTripPlanningItemsByTripIdMock.mockResolvedValue([
      planningItem,
      { ...planningItem, id: 'plan-2', plannedDate: null, title: '未排期地点' },
    ]);

    const result = await getTripPlanningSchedule('acct-1', 'trip-1');

    expect(result.days).toHaveLength(3);
    expect(result.days[1].items[0].title).toBe('岚山竹林');
    expect(result.unscheduledItems[0].title).toBe('未排期地点');
  });

  it('updates an item planned date through the schedule endpoint', async () => {
    await updateTripPlanningItemSchedule('acct-1', 'trip-1', 'plan-1', {
      plannedDate: '2026-05-03',
    });

    expect(mocks.updateTripPlanningItemMock).toHaveBeenCalledWith(
      {},
      'plan-1',
      expect.objectContaining({ plannedDate: new Date('2026-05-03T00:00:00.000Z') }),
    );
  });

  it('imports wishlist items directly into a scheduled day', async () => {
    await importWishlistItemsToTripPlanningSchedule('acct-1', 'trip-1', {
      wishlistIds: ['wishlist-1'],
      plannedDate: '2026-05-02',
    });

    expect(mocks.createTripPlanningItemMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        title: '鸭川散步',
        plannedDate: new Date('2026-05-02T00:00:00.000Z'),
        sourceWishlistId: 'wishlist-1',
      }),
    );
  });
});
