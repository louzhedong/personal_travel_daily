import { z } from 'zod';

const colorSchema = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{6})$/, 'color must be a 6-digit hex value like #2563eb');

export const createCompanionBodySchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(20, 'name must be 20 characters or fewer'),
  color: colorSchema,
});

export const updateCompanionParamsSchema = z.object({
  id: z.string().trim().min(1, 'companion id is required'),
});

export const updateCompanionBodySchema = z
  .object({
    name: z.string().trim().min(1, 'name is required').max(20, 'name must be 20 characters or fewer').optional(),
    color: colorSchema.optional(),
  })
  .refine((value) => value.name !== undefined || value.color !== undefined, {
    message: 'at least one field is required',
  });

export type CreateCompanionBody = z.infer<typeof createCompanionBodySchema>;
export type UpdateCompanionParams = z.infer<typeof updateCompanionParamsSchema>;
export type UpdateCompanionBody = z.infer<typeof updateCompanionBodySchema>;
