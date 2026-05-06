import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { listGuideSourceHealthResource } from '../services/guideSourceHealthService.js';
import { listGuideSourceHealthQuerySchema } from '../schemas/guideSourceHealth.js';
import { parseWithSchema } from '../schemas/utils.js';

export async function registerGuideSourceHealthRoutes(app: FastifyInstance) {
  app.get('/api/guide-source-health', async (request) => {
    await requireAuthenticatedAccount(request);
    const query = parseWithSchema(listGuideSourceHealthQuerySchema, request.query);
    return listGuideSourceHealthResource(query);
  });
}
