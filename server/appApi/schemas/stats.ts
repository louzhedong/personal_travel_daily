import { z } from 'zod';

export const statsOverviewQuerySchema = z.object({
  year: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'year must use YYYY format')
    .optional(),
  scope: z.enum(['all', 'domestic', 'international']).optional().default('all'),
  companionId: z.string().trim().min(1, 'companionId is required').optional(),
  tripId: z.string().trim().min(1, 'tripId is required').optional(),
});

export type StatsOverviewQuery = z.infer<typeof statsOverviewQuerySchema>;

export const annualReviewQuerySchema = z.object({
  year: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'year must use YYYY format'),
});

export type AnnualReviewQuery = z.infer<typeof annualReviewQuerySchema>;
