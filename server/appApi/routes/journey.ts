import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { journeyTimelineQuerySchema } from '../schemas/journey.js';
import { parseWithSchema } from '../schemas/utils.js';
import { getJourneyTimeline } from '../services/journeyTimelineService.js';

export async function registerJourneyRoutes(app: FastifyInstance) {
  app.get('/api/journey', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const query = parseWithSchema(journeyTimelineQuerySchema, request.query ?? {});
    return getJourneyTimeline(account, query.bucket);
  });
}
