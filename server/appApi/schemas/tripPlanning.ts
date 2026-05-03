import { z } from 'zod';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must use YYYY-MM-DD format');

const optionalDateSchema = dateSchema.nullable().optional();
const guideSourceSchema = z
  .object({
    identity: z.string().trim().min(1).max(300).optional(),
    title: z.string().trim().min(1).max(200).optional(),
    sourceName: z.string().trim().min(1).max(80).optional(),
    sourceUrl: z.string().url().optional(),
  })
  .optional();

export const tripPlanningItemParamsSchema = z.object({
  id: z.string().trim().min(1, 'trip id is required'),
  itemId: z.string().trim().min(1, 'planning item id is required'),
});

export const createTripPlanningItemBodySchema = z.object({
  companionId: z.string().trim().min(1, 'companionId is required'),
  title: z.string().trim().min(1, 'title is required').max(100),
  scope: z.enum(['domestic', 'international']),
  scopeId: z.string().trim().min(1, 'scopeId is required').max(80),
  scopeName: z.string().trim().min(1, 'scopeName is required').max(80),
  city: z.string().trim().min(1, 'city is required').max(80),
  note: z.string().trim().max(500).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  plannedDate: optionalDateSchema,
  guide: guideSourceSchema,
});

export const updateTripPlanningItemBodySchema = z
  .object({
    title: z.string().trim().min(1, 'title is required').max(100).optional(),
    scope: z.enum(['domestic', 'international']).optional(),
    scopeId: z.string().trim().min(1, 'scopeId is required').max(80).optional(),
    scopeName: z.string().trim().min(1, 'scopeName is required').max(80).optional(),
    city: z.string().trim().min(1, 'city is required').max(80).optional(),
    note: z.string().trim().max(500).nullable().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    plannedDate: optionalDateSchema,
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'at least one field is required',
  });

export const convertTripPlanningItemBodySchema = z
  .object({
    visitedStartAt: dateSchema,
    visitedEndAt: dateSchema,
    note: z.string().trim().max(500).optional(),
  })
  .refine((value) => value.visitedEndAt >= value.visitedStartAt, {
    message: 'visitedEndAt must be later than or equal to visitedStartAt',
    path: ['visitedEndAt'],
  });

export type CreateTripPlanningItemBody = z.infer<typeof createTripPlanningItemBodySchema>;
export type UpdateTripPlanningItemBody = z.infer<typeof updateTripPlanningItemBodySchema>;
export type ConvertTripPlanningItemBody = z.infer<typeof convertTripPlanningItemBodySchema>;
