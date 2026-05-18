import type { FastifyInstance } from 'fastify';
import { requireAdminAccount, requireAuthenticatedAccount } from '../auth/requestAuth.js';
import {
  listGuideSourceHealthResource,
  updateGuideSourcePreferenceResource,
} from '../services/guideSourceHealthService.js';
import {
  listGuideSourceHealthQuerySchema,
  updateGuideSourcePreferenceBodySchema,
} from '../schemas/guideSourceHealth.js';
import { parseWithSchema } from '../schemas/utils.js';

export async function registerGuideSourceHealthRoutes(app: FastifyInstance) {
  app.get('/api/guide-source-health', async (request) => {
    await requireAuthenticatedAccount(request);
    const query = parseWithSchema(listGuideSourceHealthQuerySchema, request.query);
    return listGuideSourceHealthResource(query);
  });

  app.patch('/api/guide-source-health/preferences', async (request) => {
    const account = await requireAdminAccount(request);
    const body = parseWithSchema(updateGuideSourcePreferenceBodySchema, request.body);
    return updateGuideSourcePreferenceResource(account.id, body);
  });
}
