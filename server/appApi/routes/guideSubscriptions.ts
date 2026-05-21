import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { createGuideSubscriptionBodySchema, guideSubscriptionParamsSchema, updateGuideSubscriptionBodySchema } from '../schemas/guideSubscriptions.js';
import { parseWithSchema } from '../schemas/utils.js';
import { createGuideSubscription, listGuideSubscriptions, runGuideSubscription, updateGuideSubscription } from '../services/guideSubscriptionService.js';

export async function registerGuideSubscriptionRoutes(app: FastifyInstance) {
  app.get('/api/guide-subscriptions', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    return listGuideSubscriptions(account);
  });

  app.post('/api/guide-subscriptions', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(createGuideSubscriptionBodySchema, request.body);
    return createGuideSubscription(account, body);
  });

  app.patch('/api/guide-subscriptions/:id', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(guideSubscriptionParamsSchema, request.params);
    const body = parseWithSchema(updateGuideSubscriptionBodySchema, request.body);
    return updateGuideSubscription(account, params.id, body);
  });

  app.post('/api/guide-subscriptions/:id/run', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(guideSubscriptionParamsSchema, request.params);
    return runGuideSubscription(account, params.id);
  });
}
