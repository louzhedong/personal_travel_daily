import { z } from 'zod';

export const guideSubscriptionKindSchema = z.enum(['keyword', 'source', 'destination', 'rss']);

export const guideSubscriptionParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const createGuideSubscriptionBodySchema = z.object({
  kind: guideSubscriptionKindSchema,
  title: z.string().trim().min(1).max(120),
  keyword: z.string().trim().min(1).optional(),
  sourceName: z.string().trim().min(1).optional(),
  destination: z.string().trim().min(1).optional(),
  rssUrl: z.string().trim().url().optional(),
});

export const updateGuideSubscriptionBodySchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  enabled: z.boolean().optional(),
  keyword: z.string().trim().min(1).nullable().optional(),
  sourceName: z.string().trim().min(1).nullable().optional(),
  destination: z.string().trim().min(1).nullable().optional(),
  rssUrl: z.string().trim().url().nullable().optional(),
});
