import type {
  TripExpenseCategoryDto,
  TripExpenseDto,
  TripExpenseListResponseDto,
  TripExpenseSummaryDto,
} from '../../lib/api/types';

export const TRIP_EXPENSE_CATEGORY_OPTIONS: Array<{ value: TripExpenseCategoryDto; label: string }> = [
  { value: 'transport', label: '交通' },
  { value: 'lodging', label: '住宿' },
  { value: 'food', label: '餐饮' },
  { value: 'ticket', label: '门票' },
  { value: 'shopping', label: '购物' },
  { value: 'other', label: '其他' },
];

export function formatExpenseMoney(amountCents: number, currency = 'CNY') {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export function parseExpenseAmountToCents(value: string) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized < 0) {
    return null;
  }
  return Math.round(normalized * 100);
}

export function getTripExpenseCategoryLabel(category: TripExpenseCategoryDto) {
  return TRIP_EXPENSE_CATEGORY_OPTIONS.find((item) => item.value === category)?.label ?? '其他';
}

export function buildExpenseSummaryLines(summary: TripExpenseSummaryDto) {
  return [
    { label: '实际支出', value: formatExpenseMoney(summary.actualAmountCents, summary.currency) },
    { label: '预算草稿', value: formatExpenseMoney(summary.draftAmountCents, summary.currency) },
    { label: '人均估算', value: formatExpenseMoney(summary.averagePerCompanionCents, summary.currency) },
    { label: '日均估算', value: formatExpenseMoney(summary.averagePerDayCents, summary.currency) },
  ];
}

export function getExpenseStatusLabel(expense: Pick<TripExpenseDto, 'status'>) {
  return expense.status === 'actual' ? '实际支出' : '预算草稿';
}

export function buildExpensePanelNarrative(expenses: TripExpenseListResponseDto) {
  if (expenses.summary.itemCount === 0) {
    return '还没有记录真实费用，可以先从行前规划生成预算草稿。';
  }
  const topCategory = expenses.summary.categoryBreakdown[0];
  return topCategory
    ? `当前最大开销来自${topCategory.label}，占全部费用约 ${topCategory.percentage}%。`
    : '费用已记录，后续可继续补充类别和旅伴分摊。';
}
