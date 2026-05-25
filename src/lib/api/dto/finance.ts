/**
 * F5 · Finance DTOs / 旅行财务深耕 DTO（前端镜像）
 */
export type FinanceAccountKindDto = 'cash' | 'debit' | 'credit' | 'prepaid';
export type ExpenseReimbursementStatusDto =
  | 'pending'
  | 'submitted'
  | 'reimbursed'
  | 'n_a';

export interface FinanceAccountDto {
  id: string;
  kind: FinanceAccountKindDto;
  name: string;
  currency: string;
  isArchived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceAccountListResponseDto {
  items: FinanceAccountDto[];
}

export interface FxRateSnapshotDto {
  id: string;
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  source: string;
  takenAt: string;
}

export interface FinanceAnnualReportSliceDto {
  key: string;
  label: string;
  amountCents: number;
  currency: string;
  count: number;
}

export interface FinanceAnnualReportDto {
  year: number;
  baseCurrency: string;
  totalCents: number;
  travelDays: number;
  perDayCents: number | null;
  byCategory: FinanceAnnualReportSliceDto[];
  byAccount: FinanceAnnualReportSliceDto[];
  byTrip: FinanceAnnualReportSliceDto[];
  monthly: { month: number; amountCents: number }[];
}
