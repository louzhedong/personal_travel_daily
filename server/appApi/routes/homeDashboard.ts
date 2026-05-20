import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { updateHomeDashboardPreferenceBodySchema } from '../schemas/homeDashboard.js';
import { parseWithSchema } from '../schemas/utils.js';
import { getHomeDashboard, updateHomeDashboardPreference } from '../services/homeDashboardService.js';

export async function registerHomeDashboardRoutes(app: FastifyInstance) {
  app.get('/api/home/dashboard', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    return getHomeDashboard(account);
  });

  app.patch('/api/home/dashboard/preference', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(updateHomeDashboardPreferenceBodySchema, request.body);
    return updateHomeDashboardPreference(account, body);
  });
}
