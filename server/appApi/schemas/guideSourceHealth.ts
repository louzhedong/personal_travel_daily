import { z } from 'zod';

export const listGuideSourceHealthQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export type ListGuideSourceHealthQuery = z.infer<typeof listGuideSourceHealthQuerySchema>;
