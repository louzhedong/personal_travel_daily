import { z } from 'zod';

export const tripParamsSchema = z.object({
  tripId: z.string().min(1),
});
