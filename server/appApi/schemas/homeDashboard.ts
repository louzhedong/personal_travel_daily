import { z } from 'zod';

export const homeDashboardCardIdSchema = z.enum(['latest-trip', 'next-trip', 'pending-materials', 'live-trip', 'recent-achievement']);

export const updateHomeDashboardPreferenceBodySchema = z.object({
  layout: z.array(homeDashboardCardIdSchema),
  hiddenCardIds: z.array(homeDashboardCardIdSchema),
});
