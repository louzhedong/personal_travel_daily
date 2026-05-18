import { z } from 'zod';

export const listGuideSourceHealthQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export const updateGuideSourcePreferenceBodySchema = z.object({
  sourceName: z.string().trim().min(1).max(120),
  sourceDomain: z.string().trim().min(1).max(180),
  priorityWeight: z.number().int().min(-3).max(3),
  demotionReason: z.string().trim().max(500).optional(),
});

export type ListGuideSourceHealthQuery = z.infer<typeof listGuideSourceHealthQuerySchema>;
export type UpdateGuideSourcePreferenceBody = z.infer<typeof updateGuideSourcePreferenceBodySchema>;
