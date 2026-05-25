import { z } from 'zod';

export const financeAccountKindSchema = z.enum(['cash', 'debit', 'credit', 'prepaid']);
export const expenseReimbursementStatusSchema = z.enum([
  'pending',
  'submitted',
  'reimbursed',
  'n_a',
]);

export const createFinanceAccountBodySchema = z.object({
  kind: financeAccountKindSchema,
  name: z.string().min(1).max(60),
  currency: z.string().min(3).max(8).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const updateFinanceAccountBodySchema = z.object({
  kind: financeAccountKindSchema.optional(),
  name: z.string().min(1).max(60).optional(),
  currency: z.string().min(3).max(8).optional(),
  isArchived: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const financeAccountParamsSchema = z.object({
  accountResourceId: z.string().min(1),
});

export const recordFxRateSnapshotBodySchema = z.object({
  baseCurrency: z.string().min(3).max(8),
  quoteCurrency: z.string().min(3).max(8),
  rate: z.number().positive(),
  source: z.string().min(1).max(40).optional(),
  takenAt: z.string().datetime().optional(),
});

export const financeAnnualReportQuerySchema = z.object({
  year: z.coerce.number().int().min(1970).max(3000),
  baseCurrency: z.string().min(3).max(8).optional(),
});

export type CreateFinanceAccountBody = z.infer<typeof createFinanceAccountBodySchema>;
export type UpdateFinanceAccountBody = z.infer<typeof updateFinanceAccountBodySchema>;
export type RecordFxRateSnapshotBody = z.infer<typeof recordFxRateSnapshotBodySchema>;
export type FinanceAnnualReportQuery = z.infer<typeof financeAnnualReportQuerySchema>;
