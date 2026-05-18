import { z } from 'zod';
import {
  MARKER_BUDGET_LEVELS,
  MARKER_MOODS,
  MARKER_TRANSPORTS,
  MARKER_WEATHERS,
} from '../../../shared/markerMetadata.js';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must use YYYY-MM-DD format');

const imageUrlsSchema = z.array(z.string().url('imageUrls must contain valid URLs')).max(20).optional();
const markerTagValueSchema = z.string().trim().min(2).max(32).regex(/^[a-z0-9][a-z0-9_-]*$/);
const markerTagsSchema = z.array(markerTagValueSchema).max(10).optional();
const markerMoodSchema = z.enum(MARKER_MOODS).optional().nullable();
const markerWeatherSchema = z.enum(MARKER_WEATHERS).optional().nullable();
const markerTransportSchema = z.enum(MARKER_TRANSPORTS).optional().nullable();
const markerBudgetLevelSchema = z.enum(MARKER_BUDGET_LEVELS).optional().nullable();

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
    tags: markerTagsSchema,
    mood: markerMoodSchema,
    weather: markerWeatherSchema,
    transport: markerTransportSchema,
    budgetLevel: markerBudgetLevelSchema,
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

export const searchMarkersQuerySchema = z.object({
  keyword: z.string().trim().max(100, 'keyword must be 100 characters or fewer').optional(),
  companionId: z.string().trim().min(1, 'companionId is required').optional(),
  scope: z.enum(['domestic', 'international', 'all']).optional().default('all'),
  tag: z.string().trim().min(2).max(32).regex(/^[a-z0-9][a-z0-9_-]*$/).optional(),
  mood: z.enum(MARKER_MOODS).optional(),
  weather: z.enum(MARKER_WEATHERS).optional(),
  transport: z.enum(MARKER_TRANSPORTS).optional(),
  budgetLevel: z.enum(MARKER_BUDGET_LEVELS).optional(),
  year: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'year must use YYYY format')
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const updateMarkerBodySchema = z
  .object({
    note: z.string().trim().max(500, 'note must be 500 characters or fewer').optional(),
    tags: markerTagsSchema,
    mood: markerMoodSchema,
    weather: markerWeatherSchema,
    transport: markerTransportSchema,
    budgetLevel: markerBudgetLevelSchema,
    imageUrls: imageUrlsSchema,
    visitedStartAt: dateSchema.optional(),
    visitedEndAt: dateSchema.optional(),
    tripId: z.string().trim().min(1, 'tripId is required').nullable().optional(),
  })
  .refine(
    (value) =>
      value.note !== undefined ||
      value.tags !== undefined ||
      value.mood !== undefined ||
      value.weather !== undefined ||
      value.transport !== undefined ||
      value.budgetLevel !== undefined ||
      value.imageUrls !== undefined ||
      value.visitedStartAt !== undefined ||
      value.visitedEndAt !== undefined ||
      value.tripId !== undefined,
    {
      message: 'at least one field is required',
    },
  );

export const batchUpdateMarkersTripBodySchema = z.object({
  markerIds: z.array(z.string().trim().min(1, 'markerId is required')).min(1, 'markerIds is required').max(100),
  tripId: z.string().trim().min(1, 'tripId is required').nullable().optional(),
});

export type CreateMarkerBody = z.infer<typeof createMarkerBodySchema>;
export type MarkerParams = z.infer<typeof markerParamsSchema>;
export type SearchMarkersQuery = z.infer<typeof searchMarkersQuerySchema>;
export type UpdateMarkerBody = z.infer<typeof updateMarkerBodySchema>;
export type BatchUpdateMarkersTripBody = z.infer<typeof batchUpdateMarkersTripBodySchema>;
