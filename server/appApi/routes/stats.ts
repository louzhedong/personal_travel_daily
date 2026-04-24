import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { annualReviewQuerySchema, statsOverviewQuerySchema } from '../schemas/stats.js';
import { parseWithSchema } from '../schemas/utils.js';
import { getAnnualReview, getStatsOverview } from '../services/statsService.js';

export async function registerStatsRoutes(app: FastifyInstance) {
  app.get('/api/stats/overview', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const query = parseWithSchema(statsOverviewQuerySchema, request.query);
    return getStatsOverview(account, query);
  });

  app.get('/api/stats/annual-review', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const query = parseWithSchema(annualReviewQuerySchema, request.query);
    return getAnnualReview(account, query);
  });
}
