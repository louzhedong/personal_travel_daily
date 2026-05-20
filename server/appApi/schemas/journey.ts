import { z } from 'zod';

export const journeyTimelineQuerySchema = z.object({
  bucket: z.enum(['quarter', 'half']).optional().default('quarter'),
});
