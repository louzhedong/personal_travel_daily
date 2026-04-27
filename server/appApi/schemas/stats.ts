import { z } from 'zod';
import {
  MARKER_BUDGET_LEVELS,
  MARKER_MOODS,
  MARKER_TAGS,
  MARKER_TRANSPORTS,
  MARKER_WEATHERS,
} from '../../../shared/markerMetadata.js';

export const statsOverviewQuerySchema = z.object({
  year: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'year must use YYYY format')
    .optional(),
  scope: z.enum(['all', 'domestic', 'international']).optional().default('all'),
  companionId: z.string().trim().min(1, 'companionId is required').optional(),
  tripId: z.string().trim().min(1, 'tripId is required').optional(),
  tag: z.enum(MARKER_TAGS).optional(),
  mood: z.enum(MARKER_MOODS).optional(),
  weather: z.enum(MARKER_WEATHERS).optional(),
  transport: z.enum(MARKER_TRANSPORTS).optional(),
  budgetLevel: z.enum(MARKER_BUDGET_LEVELS).optional(),
});

export type StatsOverviewQuery = z.infer<typeof statsOverviewQuerySchema>;

export const annualReviewQuerySchema = z.object({
  year: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'year must use YYYY format'),
});

export type AnnualReviewQuery = z.infer<typeof annualReviewQuerySchema>;
