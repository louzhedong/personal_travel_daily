import { z } from 'zod';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must use YYYY-MM-DD format');

const imageUrlsSchema = z.array(z.string().url('imageUrls must contain valid URLs')).max(20).optional();

function hasValidDateRange(startAt: string, endAt: string) {
  return endAt >= startAt;
}

export const createMarkerBodySchema = z
  .object({
    companionId: z.string().trim().min(1, 'companionId is required'),
    tripId: z.string().trim().min(1, 'tripId is required').optional(),
    scope: z.enum(['domestic', 'international']),
    scopeId: z.string().trim().min(1, 'scopeId is required'),
    scopeName: z.string().trim().min(1, 'scopeName is required').max(50),
    city: z.string().trim().min(1, 'city is required').max(50),
    note: z.string().trim().max(500, 'note must be 500 characters or fewer'),
    imageUrls: imageUrlsSchema,
    visitedStartAt: dateSchema,
    visitedEndAt: dateSchema,
  })
  .refine((value) => hasValidDateRange(value.visitedStartAt, value.visitedEndAt), {
    message: 'visitedEndAt must be later than or equal to visitedStartAt',
    path: ['visitedEndAt'],
  });

export const markerParamsSchema = z.object({
  id: z.string().trim().min(1, 'marker id is required'),
});

export const updateMarkerBodySchema = z
  .object({
    note: z.string().trim().max(500, 'note must be 500 characters or fewer').optional(),
    imageUrls: imageUrlsSchema,
    visitedStartAt: dateSchema.optional(),
    visitedEndAt: dateSchema.optional(),
    tripId: z.string().trim().min(1, 'tripId is required').nullable().optional(),
  })
  .refine(
    (value) =>
      value.note !== undefined ||
      value.imageUrls !== undefined ||
      value.visitedStartAt !== undefined ||
      value.visitedEndAt !== undefined ||
      value.tripId !== undefined,
    {
      message: 'at least one field is required',
    },
  );

export type CreateMarkerBody = z.infer<typeof createMarkerBodySchema>;
export type MarkerParams = z.infer<typeof markerParamsSchema>;
export type UpdateMarkerBody = z.infer<typeof updateMarkerBodySchema>;
