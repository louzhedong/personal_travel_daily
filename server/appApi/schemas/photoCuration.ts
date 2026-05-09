import { z } from 'zod';

export const photoCurationQuerySchema = z.object({
  tripId: z.string().trim().min(1).optional(),
  companionId: z.string().trim().min(1).optional(),
  year: z.coerce.number().int().min(1900).max(3000).optional(),
  featured: z.enum(['all', 'featured', 'unfeatured']).optional().default('all'),
  caption: z.enum(['all', 'withCaption', 'missingCaption']).optional().default('all'),
  limit: z.coerce.number().int().positive().max(200).optional().default(120),
});

const photoCurationItemSchema = z
  .object({
    imageId: z.string().trim().min(1, 'imageId is required'),
    isFeatured: z.boolean().optional(),
    caption: z.string().trim().max(140, 'caption must be 140 characters or fewer').nullable().optional(),
    curatedSortOrder: z.number().int().min(0).nullable().optional(),
  })
  .refine(
    (value) =>
      value.isFeatured !== undefined ||
      value.caption !== undefined ||
      value.curatedSortOrder !== undefined,
    {
      message: 'at least one curation field is required',
    },
  );

export const updatePhotoCurationBodySchema = z.object({
  items: z.array(photoCurationItemSchema).min(1, 'items are required').max(200),
});

export type PhotoCurationQuery = z.infer<typeof photoCurationQuerySchema>;
export type UpdatePhotoCurationBody = z.infer<typeof updatePhotoCurationBodySchema>;
