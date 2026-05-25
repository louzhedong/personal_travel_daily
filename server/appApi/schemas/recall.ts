import { z } from 'zod';

export const recallEventKindSchema = z.enum(['marker', 'photo', 'expense', 'journal', 'guide']);

export const recallQueryBodySchema = z.object({
  companionIds: z.array(z.string().min(1)).max(50).optional(),
  cities: z.array(z.string().min(1)).max(50).optional(),
  weathers: z.array(z.string().min(1)).max(20).optional(),
  moods: z.array(z.string().min(1)).max(20).optional(),
  tagSlugs: z.array(z.string().min(1)).max(50).optional(),
  kinds: z.array(recallEventKindSchema).max(5).optional(),
  startDate: z.string().min(1).max(40).optional(),
  endDate: z.string().min(1).max(40).optional(),
  searchKeyword: z.string().min(1).max(120).optional(),
  limit: z.number().int().min(1).max(500).optional(),
});

export type RecallQueryBody = z.infer<typeof recallQueryBodySchema>;
