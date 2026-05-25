import { z } from 'zod';

export const journalMoodSchema = z.enum([
  'delighted',
  'calm',
  'tired',
  'excited',
  'reflective',
  'neutral',
]);

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, 'date must be YYYY-MM-DD');

export const upsertJournalEntryBodySchema = z.object({
  tripId: z.string().min(1),
  entryDate: isoDateSchema,
  mood: journalMoodSchema.optional(),
  weather: z.string().max(40).optional(),
  bodyMd: z.string().max(20000).optional(),
  isPinned: z.boolean().optional(),
});

export const generateJournalDraftBodySchema = z.object({
  tripId: z.string().min(1),
  entryDate: isoDateSchema,
});

export const acceptJournalDraftBodySchema = z.object({
  entryId: z.string().min(1),
});

export const journalListQuerySchema = z.object({
  tripId: z.string().min(1),
});

export const journalParamsSchema = z.object({
  entryId: z.string().min(1),
});

export type UpsertJournalEntryBody = z.infer<typeof upsertJournalEntryBodySchema>;
export type GenerateJournalDraftBody = z.infer<typeof generateJournalDraftBodySchema>;
export type AcceptJournalDraftBody = z.infer<typeof acceptJournalDraftBodySchema>;
export type JournalListQuery = z.infer<typeof journalListQuerySchema>;
