// @vitest-environment node

import { expect, it } from 'vitest';
import { currentAccount, describeAppApiRoutesDomain, mocks } from './appApiRoutes.setup.js';
import { buildApp } from '../appApi/buildApp.js';

const expenseItem = {
  id: 'expense-1',
  tripId: 'trip-1',
  companionId: 'user-alice',
  companionName: '小悠',
  companionColor: '#2563eb',
  title: '地铁一日券',
  category: 'transport' as const,
  amountCents: 1800,
  currency: 'CNY',
  spentAt: '2026-05-01',
  status: 'actual' as const,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

describeAppApiRoutesDomain('expenses', () => {
  it('supports trip expense CRUD and planning draft routes', async () => {
    mocks.listTripExpensesMock.mockResolvedValue({
      tripId: 'trip-1',
      summary: {
        totalAmountCents: 1800,
        actualAmountCents: 1800,
        draftAmountCents: 0,
        currency: 'CNY',
        itemCount: 1,
        draftCount: 0,
        actualCount: 1,
        averagePerCompanionCents: 1800,
        averagePerDayCents: 600,
        categoryBreakdown: [{ category: 'transport', label: '交通', amountCents: 1800, itemCount: 1, percentage: 100 }],
        companionShares: [{ companionId: 'user-alice', companionName: '小悠', companionColor: '#2563eb', amountCents: 1800, itemCount: 1 }],
      },
      trend: [{ period: '2026-05', amountCents: 1800, itemCount: 1 }],
      items: [expenseItem],
    });
    mocks.createTripExpenseResourceMock.mockResolvedValue(expenseItem);
    mocks.updateTripExpenseResourceMock.mockResolvedValue({ ...expenseItem, title: '机场巴士' });
    mocks.deleteTripExpenseResourceMock.mockResolvedValue({ deletedId: 'expense-1' });
    mocks.createExpenseDraftFromPlanningItemMock.mockResolvedValue({ ...expenseItem, id: 'expense-draft-1', status: 'draft' });

    const app = await buildApp();
    try {
      const listResponse = await app.inject({ method: 'GET', url: '/api/expenses?tripId=trip-1' });
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/expenses',
        payload: {
          tripId: 'trip-1',
          companionId: 'user-alice',
          title: '地铁一日券',
          category: 'transport',
          amountCents: 1800,
          spentAt: '2026-05-01',
        },
      });
      const updateResponse = await app.inject({
        method: 'PATCH',
        url: '/api/expenses/expense-1',
        payload: { title: '机场巴士' },
      });
      const draftResponse = await app.inject({
        method: 'POST',
        url: '/api/expenses/from-planning/trip-1/plan-1',
        payload: { amountCents: 2000 },
      });
      const deleteResponse = await app.inject({ method: 'DELETE', url: '/api/expenses/expense-1' });

      expect(listResponse.statusCode).toBe(200);
      expect(createResponse.statusCode).toBe(200);
      expect(updateResponse.statusCode).toBe(200);
      expect(draftResponse.statusCode).toBe(200);
      expect(deleteResponse.statusCode).toBe(200);
      expect(mocks.listTripExpensesMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1');
      expect(mocks.createTripExpenseResourceMock).toHaveBeenCalledWith(currentAccount.id, expect.objectContaining({ amountCents: 1800 }));
      expect(mocks.updateTripExpenseResourceMock).toHaveBeenCalledWith(currentAccount.id, 'expense-1', { title: '机场巴士' });
      expect(mocks.createExpenseDraftFromPlanningItemMock).toHaveBeenCalledWith(currentAccount.id, 'trip-1', 'plan-1', {
        amountCents: 2000,
        currency: 'CNY',
        category: 'other',
      });
      expect(mocks.deleteTripExpenseResourceMock).toHaveBeenCalledWith(currentAccount.id, 'expense-1');
    } finally {
      await app.close();
    }
  });
});
