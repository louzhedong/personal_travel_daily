import type { FastifyInstance } from 'fastify';
import {
  createGuideSearchHistoryResource,
  listGuideSearchHistoriesResource,
} from '../services/guideSearchHistoryService.js';
import {
  createGuideSearchHistoryBodySchema,
  listGuideSearchHistoriesQuerySchema,
} from '../schemas/guideSearchHistories.js';
import { parseWithSchema } from '../schemas/utils.js';

export async function registerGuideSearchHistoryRoutes(app: FastifyInstance) {
  app.get('/api/guide-search-histories', async (request) => {
    const query = parseWithSchema(listGuideSearchHistoriesQuerySchema, request.query);
    return listGuideSearchHistoriesResource(query);
  });

  app.post('/api/guide-search-histories', async (request) => {
    const body = parseWithSchema(createGuideSearchHistoryBodySchema, request.body);
    return createGuideSearchHistoryResource(body);
  });
}
