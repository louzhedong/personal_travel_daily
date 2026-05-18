import { z } from 'zod';

export const markerTagValueSchema = z
  .string()
  .trim()
  .min(2, 'tag value must be at least 2 characters')
  .max(32, 'tag value must be 32 characters or fewer')
  .regex(/^[a-z0-9][a-z0-9_-]*$/, 'tag value can only contain lowercase letters, numbers, underscore, and hyphen');

export const markerTagVocabularyParamsSchema = z.object({
  value: markerTagValueSchema,
});

export const createMarkerTagVocabularyBodySchema = z.object({
  value: markerTagValueSchema.optional(),
  label: z.string().trim().min(1, 'label is required').max(20, 'label must be 20 characters or fewer'),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});

export const updateMarkerTagVocabularyBodySchema = z
  .object({
    label: z.string().trim().min(1, 'label is required').max(20, 'label must be 20 characters or fewer').optional(),
    isHidden: z.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  })
  .refine((value) => value.label !== undefined || value.isHidden !== undefined || value.sortOrder !== undefined, {
    message: 'at least one field is required',
  });

export type MarkerTagVocabularyParams = z.infer<typeof markerTagVocabularyParamsSchema>;
export type CreateMarkerTagVocabularyBody = z.infer<typeof createMarkerTagVocabularyBodySchema>;
export type UpdateMarkerTagVocabularyBody = z.infer<typeof updateMarkerTagVocabularyBodySchema>;
