/**
 * F5 · Travel Finance DTOs / 旅行财务深耕 DTO
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

export interface CreateFinanceAccountBodyDto {
  kind: FinanceAccountKindDto;
  name: string;
  currency?: string;
  sortOrder?: number;
}

export interface UpdateFinanceAccountBodyDto {
  kind?: FinanceAccountKindDto;
  name?: string;
  currency?: string;
  isArchived?: boolean;
  sortOrder?: number;
}

export interface FxRateSnapshotDto {
  id: string;
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  source: string;
  takenAt: string;
}

export interface RecordFxRateSnapshotBodyDto {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  source?: string;
  takenAt?: string;
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

export interface FinanceAnnualReportQueryDto {
  year: number;
  baseCurrency?: string;
}
