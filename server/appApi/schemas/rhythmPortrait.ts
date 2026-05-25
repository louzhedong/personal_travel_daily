import { z } from 'zod';

export const rhythmRefreshBodySchema = z
  .object({
    force: z.boolean().optional(),
  })
  .optional();
