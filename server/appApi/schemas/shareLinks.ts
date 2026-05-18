import { z } from 'zod';

export const privateShareResourceTypeSchema = z.enum([
  'trip_story',
  'annual_review',
  'companion_memory',
  'memory_capsule',
]);

export const shareLinkParamsSchema = z.object({
  id: z.string().trim().min(1, 'share link id is required'),
});

export const publicShareTokenParamsSchema = z.object({
  token: z.string().trim().min(16, 'share token is required').max(256),
});

export const createShareLinkBodySchema = z.object({
  resourceType: privateShareResourceTypeSchema,
  resourceId: z.string().trim().min(1, 'resourceId is required').max(191),
  title: z.string().trim().min(1).max(120).optional(),
  expiresAt: z.string().datetime().optional(),
  password: z.string().min(4).max(128).optional(),
  maxAccessCount: z.number().int().min(1).max(100000).optional(),
});

export const updateShareLinkBodySchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    password: z.string().min(4).max(128).nullable().optional(),
    maxAccessCount: z.number().int().min(1).max(100000).nullable().optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.expiresAt !== undefined ||
      value.password !== undefined ||
      value.maxAccessCount !== undefined,
    { message: 'at least one field is required' },
  );

export const publicShareAccessBodySchema = z.object({
  password: z.string().max(128).optional(),
});

export type ShareLinkParams = z.infer<typeof shareLinkParamsSchema>;
export type PublicShareTokenParams = z.infer<typeof publicShareTokenParamsSchema>;
export type CreateShareLinkBody = z.infer<typeof createShareLinkBodySchema>;
export type UpdateShareLinkBody = z.infer<typeof updateShareLinkBodySchema>;
export type PublicShareAccessBody = z.infer<typeof publicShareAccessBodySchema>;
