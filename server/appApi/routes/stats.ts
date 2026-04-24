import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { statsOverviewQuerySchema } from '../schemas/stats.js';
import { parseWithSchema } from '../schemas/utils.js';
import { getStatsOverview } from '../services/statsService.js';

export async function registerStatsRoutes(app: FastifyInstance) {
  app.get('/api/stats/overview', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const query = parseWithSchema(statsOverviewQuerySchema, request.query);
    return getStatsOverview(account, query);
  });
}
