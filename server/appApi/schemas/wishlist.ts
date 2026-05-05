import { z } from 'zod';

const guideSourceSchema = z
  .object({
    identity: z.string().trim().min(1).max(300).optional(),
    title: z.string().trim().min(1).max(200).optional(),
    sourceName: z.string().trim().min(1).max(80).optional(),
    sourceUrl: z.string().url().optional(),
  })
  .optional();

const targetYearSchema = z
  .string()
  .regex(/^\d{4}$/, 'targetYear must use YYYY format')
  .nullable()
  .optional();

export const wishlistItemParamsSchema = z.object({
  itemId: z.string().trim().min(1, 'wishlist item id is required'),
});

export const createWishlistItemBodySchema = z.object({
  companionId: z.string().trim().min(1, 'companionId is required'),
  title: z.string().trim().min(1, 'title is required').max(100),
  scope: z.enum(['domestic', 'international']),
  scopeId: z.string().trim().min(1, 'scopeId is required').max(80),
  scopeName: z.string().trim().min(1, 'scopeName is required').max(80),
  city: z.string().trim().min(1, 'city is required').max(80),
  note: z.string().trim().max(500).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  targetYear: targetYearSchema,
  guide: guideSourceSchema,
});

export const updateWishlistItemBodySchema = z
  .object({
    title: z.string().trim().min(1, 'title is required').max(100).optional(),
    scope: z.enum(['domestic', 'international']).optional(),
    scopeId: z.string().trim().min(1, 'scopeId is required').max(80).optional(),
    scopeName: z.string().trim().min(1, 'scopeName is required').max(80).optional(),
    city: z.string().trim().min(1, 'city is required').max(80).optional(),
    note: z.string().trim().max(500).nullable().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    targetYear: targetYearSchema,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'at least one field is required',
  });

export const convertWishlistToTripBodySchema = z
  .object({
    name: z.string().trim().min(1, 'name is required').max(80).optional(),
    note: z.string().trim().max(500, 'note must be 500 characters or fewer').optional(),
    startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startsAt must use YYYY-MM-DD format').optional(),
    endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endsAt must use YYYY-MM-DD format').optional(),
  })
  .refine((value) => !value.startsAt || !value.endsAt || value.endsAt >= value.startsAt, {
    message: 'endsAt must be later than or equal to startsAt',
    path: ['endsAt'],
  });

export type CreateWishlistItemBody = z.infer<typeof createWishlistItemBodySchema>;
export type UpdateWishlistItemBody = z.infer<typeof updateWishlistItemBodySchema>;
export type ConvertWishlistToTripBody = z.infer<typeof convertWishlistToTripBodySchema>;
