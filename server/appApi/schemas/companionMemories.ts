import { z } from 'zod';

export const companionMemoryParamsSchema = z.object({
  id: z.string().trim().min(1, 'companion id is required'),
});

export type CompanionMemoryParams = z.infer<typeof companionMemoryParamsSchema>;
