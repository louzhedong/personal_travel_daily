import { z } from 'zod';

export const createGuideSearchLogBodySchema = z.object({
  companionId: z.string().trim().min(1, 'companionId is required'),
  keyword: z.string().trim().min(1, 'keyword is required').max(100),
  scope: z.enum(['domestic', 'international', 'all']),
  provider: z.string().trim().min(1, 'provider is required').max(50),
  page: z.coerce.number().int().positive(),
  pageSize: z.coerce.number().int().positive().max(50),
  resultCount: z.coerce.number().int().min(0).max(500),
  hasMore: z.boolean(),
  durationMs: z.coerce.number().int().min(0).max(120000),
  status: z.enum(['success', 'empty', 'error']),
  errorCode: z.string().trim().max(100).optional(),
  sourceName: z.string().trim().max(100).optional(),
  sourceDomain: z.string().trim().max(255).optional(),
});

export type CreateGuideSearchLogBody = z.infer<typeof createGuideSearchLogBodySchema>;
