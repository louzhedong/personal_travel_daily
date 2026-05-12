import { z } from 'zod';

export const memoryCapsuleTypeSchema = z.enum(['trip', 'annual', 'companion']);
export const memoryCapsuleStatusSchema = z.enum(['draft', 'ready', 'archived']);
export const memoryCapsuleTemplateSchema = z.enum(['editorial', 'memoir', 'postcard', 'atlas']);
export const memoryCapsuleExportPresetSchema = z.enum(['balanced', 'compact', 'visual']);

const capsuleTextSchema = z.string().trim().max(500).optional();

const memoryCapsuleSectionConfigSchema = z.object({
  id: z.string().trim().min(1),
  enabled: z.boolean(),
  sortOrder: z.number().int().min(0),
  titleOverride: z.string().trim().max(80).optional(),
  bodyOverride: capsuleTextSchema,
});

const memoryCapsulePhotoConfigSchema = z.object({
  imageId: z.string().trim().min(1),
  sortOrder: z.number().int().min(0),
  captionOverride: z.string().trim().max(140).optional(),
  hidden: z.boolean().optional(),
});

const memoryCapsuleBadgeConfigSchema = z.object({
  id: z.string().trim().min(1),
  enabled: z.boolean(),
  labelOverride: z.string().trim().max(40).optional(),
  valueOverride: z.string().trim().max(80).optional(),
  descriptionOverride: z.string().trim().max(160).optional(),
});

export const memoryCapsuleConfigSchema = z.object({
  coverImageId: z.string().trim().min(1).optional(),
  accentColor: z.string().trim().max(32).optional(),
  exportPreset: memoryCapsuleExportPresetSchema,
  sections: z.array(memoryCapsuleSectionConfigSchema).max(40),
  photos: z.array(memoryCapsulePhotoConfigSchema).max(200),
  badges: z.array(memoryCapsuleBadgeConfigSchema).max(40),
});

export const memoryCapsuleParamsSchema = z.object({
  id: z.string().trim().min(1, 'capsule id is required'),
});

export const listMemoryCapsulesQuerySchema = z.object({
  includeArchived: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
});

export const createMemoryCapsuleBodySchema = z.object({
  type: memoryCapsuleTypeSchema,
  targetId: z.string().trim().min(1, 'targetId is required'),
  title: z.string().trim().min(1).max(80).optional(),
  subtitle: capsuleTextSchema,
  template: memoryCapsuleTemplateSchema.optional(),
});

export const updateMemoryCapsuleBodySchema = z
  .object({
    title: z.string().trim().min(1).max(80).optional(),
    subtitle: z.string().trim().max(500).nullable().optional(),
    template: memoryCapsuleTemplateSchema.optional(),
    status: z.enum(['draft', 'ready']).optional(),
    config: memoryCapsuleConfigSchema.optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.subtitle !== undefined ||
      value.template !== undefined ||
      value.status !== undefined ||
      value.config !== undefined,
    { message: 'at least one field is required' },
  );

export type MemoryCapsuleParams = z.infer<typeof memoryCapsuleParamsSchema>;
export type ListMemoryCapsulesQuery = z.infer<typeof listMemoryCapsulesQuerySchema>;
export type CreateMemoryCapsuleBody = z.infer<typeof createMemoryCapsuleBodySchema>;
export type UpdateMemoryCapsuleBody = z.infer<typeof updateMemoryCapsuleBodySchema>;
