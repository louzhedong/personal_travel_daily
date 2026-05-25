import { z } from 'zod';

export const wishlistMoodCardKindSchema = z.enum(['image', 'quote', 'note', 'season', 'budget']);

export const wishlistMoodParamsSchema = z.object({
  wishlistItemId: z.string().min(1),
});

export const wishlistMoodCardParamsSchema = z.object({
  cardId: z.string().min(1),
});

export const createWishlistMoodCardBodySchema = z.object({
  kind: wishlistMoodCardKindSchema,
  quoteText: z.string().max(2000).optional(),
  noteText: z.string().max(2000).optional(),
  seasonWindow: z.string().max(120).optional(),
  budgetCents: z.number().int().min(0).optional(),
  currency: z.string().min(3).max(8).optional(),
  imageDataUrl: z.string().min(1).optional(),
  colorTag: z.string().max(40).optional(),
  positionX: z.number().int().min(0).max(1000).optional(),
  positionY: z.number().int().min(0).max(1000).optional(),
  sortOrder: z.number().int().optional(),
});

export const updateWishlistMoodCardBodySchema = z.object({
  quoteText: z.string().max(2000).nullable().optional(),
  noteText: z.string().max(2000).nullable().optional(),
  seasonWindow: z.string().max(120).nullable().optional(),
  budgetCents: z.number().int().min(0).nullable().optional(),
  currency: z.string().min(3).max(8).nullable().optional(),
  colorTag: z.string().max(40).nullable().optional(),
  positionX: z.number().int().min(0).max(1000).optional(),
  positionY: z.number().int().min(0).max(1000).optional(),
  sortOrder: z.number().int().optional(),
});

export type CreateWishlistMoodCardBody = z.infer<typeof createWishlistMoodCardBodySchema>;
export type UpdateWishlistMoodCardBody = z.infer<typeof updateWishlistMoodCardBodySchema>;
