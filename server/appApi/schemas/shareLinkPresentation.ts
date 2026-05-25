import { z } from 'zod';

export const shareTemplateSchema = z.enum(['magazine', 'postcard', 'minimal', 'polaroid']);

const slugRegex = /^[a-z0-9][a-z0-9-]{1,40}$/u;

export const upsertShareLinkPresentationBodySchema = z.object({
  shareLinkId: z.string().min(1),
  template: shareTemplateSchema,
  slug: z
    .string()
    .min(2)
    .max(42)
    .regex(slugRegex, 'slug must be lowercase alphanumeric and hyphen'),
  ogTitle: z.string().max(120).optional(),
  ogSubtitle: z.string().max(280).optional(),
  ogCoverUrl: z.string().url().optional(),
  themeColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/u, 'themeColor must be #RRGGBB')
    .optional(),
});

export const shareDesignerParamsSchema = z.object({
  shareLinkId: z.string().min(1),
});

export const sharePublicSlugParamsSchema = z.object({
  slug: z.string().min(1),
});

export type UpsertShareLinkPresentationBody = z.infer<
  typeof upsertShareLinkPresentationBodySchema
>;
