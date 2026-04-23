import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import {
  createSavedGuideResource,
  deleteSavedGuideResource,
  listSavedGuidesResource,
} from '../services/savedGuideService.js';
import {
  createSavedGuideBodySchema,
  listSavedGuidesQuerySchema,
  savedGuideParamsSchema,
} from '../schemas/savedGuides.js';
import { parseWithSchema } from '../schemas/utils.js';

export async function registerSavedGuideRoutes(app: FastifyInstance) {
  app.get('/api/saved-guides', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const query = parseWithSchema(listSavedGuidesQuerySchema, request.query);
    return listSavedGuidesResource(account.id, query);
  });

  app.post('/api/saved-guides', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(createSavedGuideBodySchema, request.body);
    return createSavedGuideResource(account.id, body);
  });

  app.delete('/api/saved-guides/:id', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(savedGuideParamsSchema, request.params);
    return deleteSavedGuideResource(account.id, params.id);
  });
}
