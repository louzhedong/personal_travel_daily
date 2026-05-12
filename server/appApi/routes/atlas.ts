import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { atlasTimelineQuerySchema } from '../schemas/atlas.js';
import { parseWithSchema } from '../schemas/utils.js';
import { getAtlasTimeline } from '../services/atlasService.js';

export async function registerAtlasRoutes(app: FastifyInstance) {
  app.get('/api/atlas/timeline', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const query = parseWithSchema(atlasTimelineQuerySchema, request.query);
    return getAtlasTimeline(account, query);
  });
}
