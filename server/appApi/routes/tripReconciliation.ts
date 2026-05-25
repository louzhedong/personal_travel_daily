import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { tripParamsSchema } from '../schemas/tripReconciliation.js';
import { parseWithSchema } from '../schemas/utils.js';
import {
  acknowledgeReconciliationReport,
  getReconciliationReport,
  refreshReconciliationReport,
} from '../services/tripReconciliationService.js';

/**
 * G2 · Trip Reconciliation routes / 旅行对账日路由
 */
export async function registerTripReconciliationRoutes(app: FastifyInstance) {
  app.get('/api/trips/:tripId/reconciliation', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(tripParamsSchema, request.params);
    return getReconciliationReport(account, params.tripId);
  });

  app.post('/api/trips/:tripId/reconciliation/refresh', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(tripParamsSchema, request.params);
    return refreshReconciliationReport(account, params.tripId);
  });

  app.post('/api/trips/:tripId/reconciliation/acknowledge', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(tripParamsSchema, request.params);
    return acknowledgeReconciliationReport(account, params.tripId);
  });
}
