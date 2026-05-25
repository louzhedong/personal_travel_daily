import { z } from 'zod';

export const placeKindSchema = z.enum(['hotel', 'restaurant', 'sight', 'cafe', 'onsen', 'shop', 'other']);

export const createPlaceBodySchema = z.object({
  kind: placeKindSchema,
  name: z.string().min(1).max(120),
  city: z.string().max(80).optional(),
  region: z.string().max(80).optional(),
  countryCode: z.string().max(8).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  tags: z.array(z.string().min(1).max(40)).max(30).optional(),
  privateRating: z.number().int().min(1).max(5).optional(),
  myNotesMd: z.string().max(8000).optional(),
  isFavorite: z.boolean().optional(),
});

export const updatePlaceBodySchema = createPlaceBodySchema.partial();

export const placeParamsSchema = z.object({
  placeId: z.string().min(1),
});

export const placeListQuerySchema = z.object({
  kind: placeKindSchema.optional(),
  q: z.string().min(1).max(80).optional(),
  favoriteOnly: z.coerce.boolean().optional(),
});

export const promoteMarkerToPlaceBodySchema = z.object({
  markerId: z.string().min(1),
  kind: placeKindSchema,
  tags: z.array(z.string().min(1).max(40)).max(30).optional(),
});

export type CreatePlaceBody = z.infer<typeof createPlaceBodySchema>;
export type UpdatePlaceBody = z.infer<typeof updatePlaceBodySchema>;
export type PlaceListQuery = z.infer<typeof placeListQuerySchema>;
export type PromoteMarkerToPlaceBody = z.infer<typeof promoteMarkerToPlaceBodySchema>;
