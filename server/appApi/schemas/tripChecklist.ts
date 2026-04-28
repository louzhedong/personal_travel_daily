import { z } from 'zod';

const tripChecklistStageSchema = z.enum(['pre_departure', 'in_transit', 'done']);

const guideSummarySchema = z.string().trim().max(3000, 'guide.summary must be 3000 characters or fewer').optional().default('');

export const tripChecklistItemParamsSchema = z.object({
  id: z.string().trim().min(1, 'trip id is required'),
  itemId: z.string().trim().min(1, 'item id is required'),
});

export const generateTripChecklistBodySchema = z.object({
  companionId: z.string().trim().min(1, 'companionId is required'),
  guide: z.object({
    title: z.string().trim().min(1, 'guide.title is required').max(160),
    summary: guideSummarySchema,
    sourceName: z.string().trim().min(1, 'guide.sourceName is required').max(80),
    sourceUrl: z.string().url('guide.sourceUrl must be a valid URL'),
  }),
});

export const createTripChecklistItemBodySchema = z.object({
  companionId: z.string().trim().min(1, 'companionId is required'),
  title: z.string().trim().min(1, 'title is required').max(120),
  note: z.string().trim().max(500, 'note must be 500 characters or fewer').optional(),
  stage: tripChecklistStageSchema,
});

export const updateTripChecklistItemBodySchema = z
  .object({
    title: z.string().trim().min(1, 'title is required').max(120).optional(),
    note: z.string().trim().max(500, 'note must be 500 characters or fewer').nullable().optional(),
    stage: tripChecklistStageSchema.optional(),
    sortOrder: z.number().int().min(0).max(999).optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.note !== undefined ||
      value.stage !== undefined ||
      value.sortOrder !== undefined,
    {
      message: 'at least one field is required',
    },
  );

export type TripChecklistItemParams = z.infer<typeof tripChecklistItemParamsSchema>;
export type GenerateTripChecklistBody = z.infer<typeof generateTripChecklistBodySchema>;
export type CreateTripChecklistItemBody = z.infer<typeof createTripChecklistItemBodySchema>;
export type UpdateTripChecklistItemBody = z.infer<typeof updateTripChecklistItemBodySchema>;
