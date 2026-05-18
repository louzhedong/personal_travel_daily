import { describe, expect, it } from 'vitest';
import {
  buildExpensePanelNarrative,
  formatExpenseMoney,
  getTripExpenseCategoryLabel,
  parseExpenseAmountToCents,
} from '../expenses/expenseModel';

describe('expenseModel', () => {
  it('formats amount, parses input and builds narrative copy', () => {
    expect(formatExpenseMoney(125000, 'CNY')).toContain('1,250');
    expect(parseExpenseAmountToCents('88.6')).toBe(8860);
    expect(parseExpenseAmountToCents('-1')).toBeNull();
    expect(getTripExpenseCategoryLabel('transport')).toBe('交通');
    expect(
      buildExpensePanelNarrative({
        tripId: 'trip-1',
        summary: {
          totalAmountCents: 10000,
          actualAmountCents: 10000,
          draftAmountCents: 0,
          currency: 'CNY',
          itemCount: 1,
          draftCount: 0,
          actualCount: 1,
          averagePerCompanionCents: 10000,
          averagePerDayCents: 10000,
          categoryBreakdown: [{ category: 'food', label: '餐饮', amountCents: 10000, itemCount: 1, percentage: 100 }],
          companionShares: [],
        },
        trend: [],
        items: [],
      }),
    ).toContain('餐饮');
  });
});
