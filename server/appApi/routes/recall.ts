import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { recallQueryBodySchema } from '../schemas/recall.js';
import { parseWithSchema } from '../schemas/utils.js';
import { queryRecall, rebuildRecallIndex } from '../services/recallIndexService.js';

/**
 * G3 · Event-Centric Recall routes / 事件维度回想路由
 */
export async function registerRecallRoutes(app: FastifyInstance) {
  app.post('/api/recall/query', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(recallQueryBodySchema, request.body ?? {});
    return queryRecall(account, body);
  });

  app.post('/api/recall/rebuild', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    return rebuildRecallIndex(account.id);
  });
}
