import { z } from 'zod';

export const assistantContextTypeSchema = z.enum(['home', 'trip', 'photos', 'journey']);
export const assistantStyleSchema = z.enum(['magazine', 'journal', 'postcard']);

export const createAssistantSuggestionBodySchema = z.object({
  contextType: assistantContextTypeSchema,
  contextId: z.string().trim().min(1).optional(),
  style: assistantStyleSchema.optional(),
});

export const assistantSuggestionParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const confirmAssistantSuggestionBodySchema = z.object({
  actionIds: z.array(z.string().trim().min(1)).optional(),
});

export const updateAssistantPreferenceBodySchema = z.object({
  style: assistantStyleSchema,
});
