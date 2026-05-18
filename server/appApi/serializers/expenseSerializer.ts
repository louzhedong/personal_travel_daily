import type { TravelCompanion, TripExpense } from '@prisma/client';
import type {
  TripExpenseCategoryDto,
  TripExpenseDto,
  TripExpenseListResponseDto,
  TripExpenseSummaryDto,
  TripExpenseTrendPointDto,
} from '../types.js';

export const TRIP_EXPENSE_CATEGORY_LABELS: Record<TripExpenseCategoryDto, string> = {
  transport: '交通',
  lodging: '住宿',
  food: '餐饮',
  ticket: '门票',
  shopping: '购物',
  other: '其他',
};

type ExpenseWithCompanion = TripExpense & {
  companion?: TravelCompanion | null;
};

function toIsoString(value: Date) {
  return value.toISOString();
}

function toDateOnlyString(value: Date) {
  return value.toISOString().slice(0, 10);
}

function normalizeCategory(category: string): TripExpenseCategoryDto {
  return category in TRIP_EXPENSE_CATEGORY_LABELS ? (category as TripExpenseCategoryDto) : 'other';
}

export function serializeTripExpense(expense: ExpenseWithCompanion): TripExpenseDto {
  return {
    id: expense.id,
    tripId: expense.tripId,
    companionId: expense.companionId ?? undefined,
    companionName: expense.companion?.name,
    companionColor: expense.companion?.color,
    sourcePlanningItemId: expense.sourcePlanningItemId ?? undefined,
    title: expense.title,
    category: normalizeCategory(expense.category),
    amountCents: expense.amountCents,
    currency: expense.currency,
    spentAt: toDateOnlyString(expense.spentAt),
    note: expense.note ?? undefined,
    status: expense.status,
    createdAt: toIsoString(expense.createdAt),
    updatedAt: toIsoString(expense.updatedAt),
  };
}

export function buildTripExpenseTrend(expenses: ExpenseWithCompanion[]): TripExpenseTrendPointDto[] {
  const trendMap = new Map<string, { amountCents: number; itemCount: number }>();

  expenses
    .filter((expense) => expense.status === 'actual')
    .forEach((expense) => {
      const period = expense.spentAt.toISOString().slice(0, 7);
      const current = trendMap.get(period) ?? { amountCents: 0, itemCount: 0 };
      current.amountCents += expense.amountCents;
      current.itemCount += 1;
      trendMap.set(period, current);
    });

  return Array.from(trendMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([period, value]) => ({ period, ...value }));
}

export function buildTripExpenseSummary(
  expenses: ExpenseWithCompanion[],
  options: {
    travelDays?: number;
    companionCount?: number;
  } = {},
): TripExpenseSummaryDto {
  const totalAmountCents = expenses.reduce((total, expense) => total + expense.amountCents, 0);
  const actualExpenses = expenses.filter((expense) => expense.status === 'actual');
  const draftExpenses = expenses.filter((expense) => expense.status === 'draft');
  const actualAmountCents = actualExpenses.reduce((total, expense) => total + expense.amountCents, 0);
  const draftAmountCents = draftExpenses.reduce((total, expense) => total + expense.amountCents, 0);
  const currency = expenses[0]?.currency ?? 'CNY';
  const categoryMap = new Map<TripExpenseCategoryDto, { amountCents: number; itemCount: number }>();
  const companionMap = new Map<string, { companionId?: string; companionName: string; companionColor?: string; amountCents: number; itemCount: number }>();

  expenses.forEach((expense) => {
    const category = normalizeCategory(expense.category);
    const categoryCurrent = categoryMap.get(category) ?? { amountCents: 0, itemCount: 0 };
    categoryCurrent.amountCents += expense.amountCents;
    categoryCurrent.itemCount += 1;
    categoryMap.set(category, categoryCurrent);

    const companionKey = expense.companionId ?? 'unassigned';
    const companionCurrent = companionMap.get(companionKey) ?? {
      companionId: expense.companionId ?? undefined,
      companionName: expense.companion?.name ?? '未分摊',
      companionColor: expense.companion?.color,
      amountCents: 0,
      itemCount: 0,
    };
    companionCurrent.amountCents += expense.amountCents;
    companionCurrent.itemCount += 1;
    companionMap.set(companionKey, companionCurrent);
  });

  const safeCompanionCount = Math.max(1, options.companionCount ?? companionMap.size ?? 1);
  const safeTravelDays = Math.max(1, options.travelDays ?? 1);

  return {
    totalAmountCents,
    actualAmountCents,
    draftAmountCents,
    currency,
    itemCount: expenses.length,
    draftCount: draftExpenses.length,
    actualCount: actualExpenses.length,
    averagePerCompanionCents: Math.round(totalAmountCents / safeCompanionCount),
    averagePerDayCents: Math.round(totalAmountCents / safeTravelDays),
    categoryBreakdown: Array.from(categoryMap.entries())
      .map(([category, value]) => ({
        category,
        label: TRIP_EXPENSE_CATEGORY_LABELS[category],
        amountCents: value.amountCents,
        itemCount: value.itemCount,
        percentage: totalAmountCents > 0 ? Math.round((value.amountCents / totalAmountCents) * 100) : 0,
      }))
      .sort((left, right) => right.amountCents - left.amountCents),
    companionShares: Array.from(companionMap.values()).sort((left, right) => right.amountCents - left.amountCents),
  };
}

export function serializeTripExpenseList(
  tripId: string,
  expenses: ExpenseWithCompanion[],
  options?: {
    travelDays?: number;
    companionCount?: number;
  },
): TripExpenseListResponseDto {
  return {
    tripId,
    summary: buildTripExpenseSummary(expenses, options),
    trend: buildTripExpenseTrend(expenses),
    items: expenses.map(serializeTripExpense),
  };
}
