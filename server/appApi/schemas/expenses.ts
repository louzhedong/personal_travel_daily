import { z } from 'zod';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must use YYYY-MM-DD format');

export const expenseCategorySchema = z.enum(['transport', 'lodging', 'food', 'ticket', 'shopping', 'other']);
export const expenseStatusSchema = z.enum(['draft', 'actual']);

export const tripExpenseListQuerySchema = z.object({
  tripId: z.string().trim().min(1, 'tripId is required'),
});

export const tripExpenseParamsSchema = z.object({
  id: z.string().trim().min(1, 'expense id is required'),
});

export const createTripExpenseBodySchema = z.object({
  tripId: z.string().trim().min(1, 'tripId is required'),
  companionId: z.string().trim().min(1).nullable().optional(),
  sourcePlanningItemId: z.string().trim().min(1).nullable().optional(),
  title: z.string().trim().min(1, 'title is required').max(100),
  category: expenseCategorySchema,
  amountCents: z.number().int().min(0, 'amountCents must be non-negative'),
  currency: z.string().trim().length(3).optional().default('CNY'),
  spentAt: dateSchema,
  note: z.string().trim().max(500).nullable().optional(),
  status: expenseStatusSchema.optional().default('actual'),
});

export const updateTripExpenseBodySchema = z
  .object({
    companionId: z.string().trim().min(1).nullable().optional(),
    sourcePlanningItemId: z.string().trim().min(1).nullable().optional(),
    title: z.string().trim().min(1, 'title is required').max(100).optional(),
    category: expenseCategorySchema.optional(),
    amountCents: z.number().int().min(0, 'amountCents must be non-negative').optional(),
    currency: z.string().trim().length(3).optional(),
    spentAt: dateSchema.optional(),
    note: z.string().trim().max(500).nullable().optional(),
    status: expenseStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'at least one field is required',
  });

export const createTripExpenseDraftFromPlanningBodySchema = z.object({
  amountCents: z.number().int().min(0, 'amountCents must be non-negative'),
  currency: z.string().trim().length(3).optional().default('CNY'),
  category: expenseCategorySchema.optional().default('other'),
  note: z.string().trim().max(500).nullable().optional(),
});

export const tripExpensePlanningParamsSchema = z.object({
  tripId: z.string().trim().min(1, 'trip id is required'),
  itemId: z.string().trim().min(1, 'planning item id is required'),
});

export type CreateTripExpenseBody = z.infer<typeof createTripExpenseBodySchema>;
export type UpdateTripExpenseBody = z.infer<typeof updateTripExpenseBodySchema>;
export type CreateTripExpenseDraftFromPlanningBody = z.infer<typeof createTripExpenseDraftFromPlanningBodySchema>;
