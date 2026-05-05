import { z } from 'zod';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must use YYYY-MM-DD format');

const coverImageUrlSchema = z.string().url('coverImageUrl must be a valid URL').optional();

function hasValidDateRange(startsAt: string, endsAt: string) {
  return endsAt >= startsAt;
}

export const createTripBodySchema = z
  .object({
    name: z.string().trim().min(1, 'name is required').max(80),
    coverImageUrl: coverImageUrlSchema,
    note: z.string().trim().max(500, 'note must be 500 characters or fewer').default(''),
    startsAt: dateSchema,
    endsAt: dateSchema,
  })
  .refine((value) => hasValidDateRange(value.startsAt, value.endsAt), {
    message: 'endsAt must be later than or equal to startsAt',
    path: ['endsAt'],
  });

export const tripParamsSchema = z.object({
  id: z.string().trim().min(1, 'trip id is required'),
});

export const updateTripBodySchema = z
  .object({
    name: z.string().trim().min(1, 'name is required').max(80).optional(),
    coverImageUrl: z.string().url('coverImageUrl must be a valid URL').nullable().optional(),
    note: z.string().trim().max(500, 'note must be 500 characters or fewer').optional(),
    startsAt: dateSchema.optional(),
    endsAt: dateSchema.optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.coverImageUrl !== undefined ||
      value.note !== undefined ||
      value.startsAt !== undefined ||
      value.endsAt !== undefined,
    {
      message: 'at least one field is required',
    },
  );

const tripPhotoCurationItemSchema = z
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

export const updateTripPhotoCurationBodySchema = z.object({
  items: z.array(tripPhotoCurationItemSchema).min(1, 'items are required').max(200),
});

export type CreateTripBody = z.infer<typeof createTripBodySchema>;
export type TripParams = z.infer<typeof tripParamsSchema>;
export type UpdateTripBody = z.infer<typeof updateTripBodySchema>;
export type UpdateTripPhotoCurationBody = z.infer<typeof updateTripPhotoCurationBodySchema>;
