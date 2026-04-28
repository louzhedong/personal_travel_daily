// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPrismaClientMock: vi.fn(),
  findActiveTripByIdMock: vi.fn(),
  findActiveCompanionByIdMock: vi.fn(),
  listActiveTripChecklistItemsByTripIdMock: vi.fn(),
  findActiveTripChecklistItemByIdMock: vi.fn(),
  getNextTripChecklistSortOrderMock: vi.fn(),
  createTripChecklistItemMock: vi.fn(),
  updateTripChecklistItemMock: vi.fn(),
  softDeleteTripChecklistItemMock: vi.fn(),
  buildGeneratedTripChecklistDraftsMock: vi.fn(),
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

vi.mock('../appApi/repositories/tripRepository.js', () => ({
  findActiveTripById: mocks.findActiveTripByIdMock,
}));

vi.mock('../appApi/repositories/travelCompanionRepository.js', () => ({
  findActiveCompanionById: mocks.findActiveCompanionByIdMock,
}));

vi.mock('../appApi/repositories/tripChecklistRepository.js', () => ({
  listActiveTripChecklistItemsByTripId: mocks.listActiveTripChecklistItemsByTripIdMock,
  findActiveTripChecklistItemById: mocks.findActiveTripChecklistItemByIdMock,
  getNextTripChecklistSortOrder: mocks.getNextTripChecklistSortOrderMock,
  createTripChecklistItem: mocks.createTripChecklistItemMock,
  updateTripChecklistItem: mocks.updateTripChecklistItemMock,
  softDeleteTripChecklistItem: mocks.softDeleteTripChecklistItemMock,
}));

vi.mock('../appApi/services/tripChecklistGenerationService.js', () => ({
  buildGeneratedTripChecklistDrafts: mocks.buildGeneratedTripChecklistDraftsMock,
}));

import {
  createTripChecklistItemResource,
  deleteTripChecklistItemResource,
  generateTripChecklist,
  listTripChecklist,
  updateTripChecklistItemResource,
} from '../appApi/services/tripChecklistService.js';

const companion = {
  id: 'user-alice',
  accountId: 'acct-1',
  name: '小悠',
  color: '#2563eb',
  sortOrder: 0,
  createdAt: new Date('2026-05-01T00:00:00.000Z'),
  updatedAt: new Date('2026-05-01T00:00:00.000Z'),
  deletedAt: null,
  isDeleted: false,
};

const baseItem = {
  id: 'item-1',
  accountId: 'acct-1',
  tripId: 'trip-1',
  createdByCompanionId: 'user-alice',
  title: '提前确认景点预约',
  note: '避开中午高峰',
  stage: 'pre_departure' as const,
  sortOrder: 0,
  origin: 'generated',
  sourceGuideIdentity: 'https://example.com/guide',
  sourceGuideTitle: '京都春日路线',
  sourceGuideSourceName: 'Mock Guide',
  sourceGuideSourceUrl: 'https://example.com/guide',
  sourceSnippet: '建议提前预约',
  isDeleted: false,
  createdAt: new Date('2026-05-01T00:00:00.000Z'),
  updatedAt: new Date('2026-05-01T00:00:00.000Z'),
  deletedAt: null,
  createdByCompanion: companion,
};

describe('tripChecklistService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getPrismaClientMock.mockReturnValue({
      $transaction: (callback: (tx: object) => unknown) => callback({}),
    });
    mocks.findActiveTripByIdMock.mockResolvedValue({ id: 'trip-1', accountId: 'acct-1', name: '京都春日行' });
    mocks.findActiveCompanionByIdMock.mockResolvedValue(companion);
    mocks.listActiveTripChecklistItemsByTripIdMock.mockResolvedValue([baseItem]);
    mocks.findActiveTripChecklistItemByIdMock.mockResolvedValue(baseItem);
    mocks.getNextTripChecklistSortOrderMock.mockResolvedValue(1);
    mocks.createTripChecklistItemMock.mockResolvedValue(baseItem);
    mocks.updateTripChecklistItemMock.mockResolvedValue({
      ...baseItem,
      stage: 'done',
      updatedAt: new Date('2026-05-02T00:00:00.000Z'),
    });
    mocks.buildGeneratedTripChecklistDraftsMock.mockResolvedValue([
      {
        title: '提前确认景点预约',
        stage: 'pre_departure',
        sourceSnippet: '建议提前预约',
      },
      {
        title: '准备机场到市区交通方案',
        stage: 'pre_departure',
        sourceSnippet: '机场到市区',
      },
      {
        title: '把鸭川夜游放在同一天',
        stage: 'in_transit',
        sourceSnippet: '夜游安排',
      },
    ]);
  });

  it('groups checklist items into three stages', async () => {
    const result = await listTripChecklist('acct-1', 'trip-1');

    expect(result.summary.total).toBe(1);
    expect(result.groups[0].title).toBe('出发前准备');
    expect(result.groups[0].items[0].title).toBe('提前确认景点预约');
  });

  it('creates and updates manual checklist items', async () => {
    await createTripChecklistItemResource('acct-1', 'trip-1', {
      companionId: 'user-alice',
      title: '准备机场快线车票',
      note: '可以提前买电子票',
      stage: 'pre_departure',
    });

    expect(mocks.createTripChecklistItemMock).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        title: '准备机场快线车票',
        origin: 'manual',
      }),
    );

    const updated = await updateTripChecklistItemResource('acct-1', 'trip-1', 'item-1', {
      stage: 'done',
      note: '已完成',
    });

    expect(updated.stage).toBe('done');
    expect(mocks.updateTripChecklistItemMock).toHaveBeenCalledWith(
      {},
      'item-1',
      expect.objectContaining({ stage: 'done' }),
    );
  });

  it('generates checklist items and skips duplicates from the same guide', async () => {
    mocks.createTripChecklistItemMock
      .mockResolvedValueOnce({
        ...baseItem,
        id: 'item-2',
        title: '准备机场到市区交通方案',
      })
      .mockResolvedValueOnce({
        ...baseItem,
        id: 'item-3',
        title: '把鸭川夜游放在同一天',
        stage: 'in_transit',
      });

    const result = await generateTripChecklist('acct-1', 'trip-1', {
      companionId: 'user-alice',
      guide: {
        title: '京都春日路线',
        summary: '适合第一次去京都的三天行程。',
        sourceName: 'Mock Guide',
        sourceUrl: 'https://example.com/guide',
      },
    });

    expect(result.createdCount).toBe(2);
    expect(result.deduplicatedCount).toBe(1);
    expect(result.items.map((item) => item.title)).toEqual(['准备机场到市区交通方案', '把鸭川夜游放在同一天']);
  });

  it('soft deletes checklist items', async () => {
    await deleteTripChecklistItemResource('acct-1', 'trip-1', 'item-1');

    expect(mocks.softDeleteTripChecklistItemMock).toHaveBeenCalledWith({}, 'item-1', expect.any(Date));
  });
});
