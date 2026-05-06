import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { createGuideSearchLogResource } from '../services/guideSearchLogService.js';
import { createGuideSearchLogBodySchema } from '../schemas/guideSearchLogs.js';
import { parseWithSchema } from '../schemas/utils.js';

export async function registerGuideSearchLogRoutes(app: FastifyInstance) {
  app.post('/api/guide-search-logs', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(createGuideSearchLogBodySchema, request.body);
    return createGuideSearchLogResource(account.id, body);
  });
}
