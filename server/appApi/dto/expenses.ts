export type TripExpenseStatusDto = 'draft' | 'actual';

export type TripExpenseCategoryDto =
  | 'transport'
  | 'lodging'
  | 'food'
  | 'ticket'
  | 'shopping'
  | 'other';

export interface TripExpenseDto {
  id: string;
  tripId: string;
  companionId?: string;
  companionName?: string;
  companionColor?: string;
  sourcePlanningItemId?: string;
  title: string;
  category: TripExpenseCategoryDto;
  amountCents: number;
  currency: string;
  spentAt: string;
  note?: string;
  status: TripExpenseStatusDto;
  createdAt: string;
  updatedAt: string;
}

export interface TripExpenseCategorySummaryDto {
  category: TripExpenseCategoryDto;
  label: string;
  amountCents: number;
  itemCount: number;
  percentage: number;
}

export interface TripExpenseCompanionShareDto {
  companionId?: string;
  companionName: string;
  companionColor?: string;
  amountCents: number;
  itemCount: number;
}

export interface TripExpenseSummaryDto {
  totalAmountCents: number;
  actualAmountCents: number;
  draftAmountCents: number;
  currency: string;
  itemCount: number;
  draftCount: number;
  actualCount: number;
  averagePerCompanionCents: number;
  averagePerDayCents: number;
  categoryBreakdown: TripExpenseCategorySummaryDto[];
  companionShares: TripExpenseCompanionShareDto[];
}

export interface TripExpenseTrendPointDto {
  period: string;
  amountCents: number;
  itemCount: number;
}

export interface TripExpenseListResponseDto {
  tripId: string;
  summary: TripExpenseSummaryDto;
  trend: TripExpenseTrendPointDto[];
  items: TripExpenseDto[];
}

export interface TripSettlementTransferDto {
  fromCompanionId?: string;
  fromCompanionName: string;
  toCompanionId?: string;
  toCompanionName: string;
  amountCents: number;
  currency: string;
}

export interface TripSettlementBalanceDto {
  companionId?: string;
  companionName: string;
  paidCents: number;
  shareCents: number;
  balanceCents: number;
  currency: string;
}

export interface TripSettlementResponseDto {
  tripId: string;
  currency: string;
  balances: TripSettlementBalanceDto[];
  transfers: TripSettlementTransferDto[];
  csv: string;
  generatedAt: string;
}

export interface CreateTripExpenseInputDto {
  tripId: string;
  companionId?: string | null;
  sourcePlanningItemId?: string | null;
  title: string;
  category: TripExpenseCategoryDto;
  amountCents: number;
  currency?: string;
  spentAt: string;
  note?: string | null;
  status?: TripExpenseStatusDto;
}

export interface UpdateTripExpenseInputDto {
  companionId?: string | null;
  sourcePlanningItemId?: string | null;
  title?: string;
  category?: TripExpenseCategoryDto;
  amountCents?: number;
  currency?: string;
  spentAt?: string;
  note?: string | null;
  status?: TripExpenseStatusDto;
}

export interface CreateTripExpenseDraftFromPlanningInputDto {
  amountCents: number;
  currency?: string;
  category?: TripExpenseCategoryDto;
  note?: string | null;
}

export interface DeleteTripExpenseResponseDto {
  deletedId: string;
}
