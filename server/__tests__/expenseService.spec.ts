// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPrismaClientMock: vi.fn(),
}));

vi.mock('../appApi/prisma.js', () => ({
  getPrismaClient: mocks.getPrismaClientMock,
}));

import { createExpenseDraftFromPlanningItem, createTripExpenseResource, listTripExpenses } from '../appApi/services/expenseService.js';

describe('expenseService', () => {
  const trip = {
    id: 'trip-1',
    accountId: 'acct-1',
    startsAt: new Date('2026-05-01T00:00:00.000Z'),
    endsAt: new Date('2026-05-03T00:00:00.000Z'),
    markers: [{ companionId: 'user-alice' }],
  };
  const companion = {
    id: 'user-alice',
    accountId: 'acct-1',
    name: '小悠',
    color: '#2563eb',
  };
  const expense = {
    id: 'expense-1',
    accountId: 'acct-1',
    tripId: 'trip-1',
    companionId: 'user-alice',
    sourcePlanningItemId: null,
    title: '西湖船票',
    category: 'ticket',
    amountCents: 5500,
    currency: 'CNY',
    spentAt: new Date('2026-05-02T00:00:00.000Z'),
    note: null,
    status: 'actual',
    isDeleted: false,
    createdAt: new Date('2026-05-02T00:00:00.000Z'),
    updatedAt: new Date('2026-05-02T00:00:00.000Z'),
    deletedAt: null,
    companion,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists trip expenses with summary and trend', async () => {
    const prisma = {
      trip: { findFirst: vi.fn().mockResolvedValue(trip) },
      tripExpense: { findMany: vi.fn().mockResolvedValue([expense]) },
    };
    mocks.getPrismaClientMock.mockReturnValue(prisma);

    const result = await listTripExpenses('acct-1', 'trip-1');

    expect(result.summary.totalAmountCents).toBe(5500);
    expect(result.summary.averagePerDayCents).toBe(1833);
    expect(result.trend).toEqual([{ period: '2026-05', amountCents: 5500, itemCount: 1 }]);
  });

  it('creates actual expenses and planning drafts', async () => {
    const prisma = {
      trip: { findFirst: vi.fn().mockResolvedValue(trip) },
      travelCompanion: { findFirst: vi.fn().mockResolvedValue(companion) },
      tripPlanningItem: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'plan-1',
          tripId: 'trip-1',
          accountId: 'acct-1',
          createdByCompanionId: 'user-alice',
          title: '西湖游船',
          note: '提前买票',
          plannedDate: new Date('2026-05-02T00:00:00.000Z'),
          status: 'planned',
        }),
      },
      tripExpense: {
        create: vi.fn()
          .mockResolvedValueOnce(expense)
          .mockResolvedValueOnce({ ...expense, id: 'expense-draft-1', title: '西湖游船', status: 'draft' }),
      },
    };
    mocks.getPrismaClientMock.mockReturnValue(prisma);

    const created = await createTripExpenseResource('acct-1', {
      tripId: 'trip-1',
      companionId: 'user-alice',
      title: '西湖船票',
      category: 'ticket',
      amountCents: 5500,
      currency: 'cny',
      spentAt: '2026-05-02',
      status: 'actual',
    });
    const draft = await createExpenseDraftFromPlanningItem('acct-1', 'trip-1', 'plan-1', {
      amountCents: 6600,
      currency: 'CNY',
      category: 'ticket',
    });

    expect(created.currency).toBe('CNY');
    expect(draft.status).toBe('draft');
    expect(prisma.tripExpense.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ currency: 'CNY', status: 'actual' }),
    }));
  });
});
