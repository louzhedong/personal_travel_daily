import { z } from 'zod';

export const listGuideSearchHistoriesQuerySchema = z.object({
  companionId: z.string().trim().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export const createGuideSearchHistoryBodySchema = z.object({
  companionId: z.string().trim().min(1, 'companionId is required'),
  keyword: z.string().trim().min(1, 'keyword is required').max(100),
  scope: z.enum(['domestic', 'international', 'all']),
});

export type ListGuideSearchHistoriesQuery = z.infer<typeof listGuideSearchHistoriesQuerySchema>;
export type CreateGuideSearchHistoryBody = z.infer<typeof createGuideSearchHistoryBodySchema>;
