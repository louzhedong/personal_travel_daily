import { z } from 'zod';

const guideResultSchema = z.object({
  id: z.string().trim().min(1, 'guide result id is required'),
  title: z.string().trim().min(1, 'guide title is required'),
  summary: z.string().trim().min(1, 'guide summary is required'),
  coverImageUrl: z.string().trim().url().optional(),
  sourceName: z.string().trim().min(1, 'guide sourceName is required'),
  sourceUrl: z.string().trim().url('guide sourceUrl must be a valid URL'),
  authorName: z.string().trim().optional(),
  publishedAt: z.string().trim().optional(),
  destinationLabel: z.string().trim().optional(),
  tags: z.array(z.string().trim()).optional(),
  contentHtml: z.string().optional(),
  fetchedAt: z.string().optional(),
  blocks: z
    .array(
      z.object({
        id: z.string().trim(),
        type: z.enum(['paragraph', 'bullet-list', 'section-title', 'tips']),
        text: z.string(),
      }),
    )
    .optional(),
})
  .passthrough();

export const listSavedGuidesQuerySchema = z.object({
  companionId: z.string().trim().optional(),
  markerId: z.string().trim().optional(),
});

export const createSavedGuideBodySchema = z.object({
  savedByUserId: z.string().trim().min(1, 'savedByUserId is required'),
  markerId: z.string().trim().optional(),
  keyword: z.string().trim().min(1, 'keyword is required').max(100),
  result: guideResultSchema,
});

export const savedGuideParamsSchema = z.object({
  id: z.string().trim().min(1, 'saved guide id is required'),
});

export type ListSavedGuidesQuery = z.infer<typeof listSavedGuidesQuerySchema>;
export type CreateSavedGuideBody = z.infer<typeof createSavedGuideBodySchema>;
export type SavedGuideParams = z.infer<typeof savedGuideParamsSchema>;
