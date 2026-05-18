import { z } from 'zod';
import {
  MARKER_BUDGET_LEVELS,
  MARKER_MOODS,
  MARKER_TRANSPORTS,
  MARKER_WEATHERS,
} from '../../../shared/markerMetadata.js';

const optionalAllString = z
  .string()
  .trim()
  .transform((value) => (value === 'all' || value.length === 0 ? undefined : value))
  .optional();

export const atlasTimelineQuerySchema = z.object({
  year: z
    .string()
    .trim()
    .refine((value) => value === 'all' || /^\d{4}$/.test(value), 'year must use YYYY format')
    .transform((value) => (value === 'all' ? undefined : value))
    .optional(),
  month: z
    .string()
    .trim()
    .refine((value) => value === 'all' || /^(0[1-9]|1[0-2])$/.test(value), 'month must use MM format')
    .transform((value) => (value === 'all' ? undefined : value))
    .optional(),
  scope: z.enum(['all', 'domestic', 'international']).optional().default('all'),
  companionId: optionalAllString,
  tripId: optionalAllString,
  tag: z.string().trim().min(2).max(32).regex(/^[a-z0-9][a-z0-9_-]*$/).optional(),
  mood: z.enum(MARKER_MOODS).optional(),
  weather: z.enum(MARKER_WEATHERS).optional(),
  transport: z.enum(MARKER_TRANSPORTS).optional(),
  budgetLevel: z.enum(MARKER_BUDGET_LEVELS).optional(),
});

export type AtlasTimelineQuery = z.infer<typeof atlasTimelineQuerySchema>;
