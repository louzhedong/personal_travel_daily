import { z } from 'zod';

export const resolveGeoLookupBodySchema = z.object({
  label: z.string().trim().min(1),
  scope: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
});

export const markerGeoParamsSchema = z.object({
  markerId: z.string().trim().min(1),
});

export const enhanceMarkerGeoBodySchema = z.object({
  label: z.string().trim().min(1).optional(),
});
