import type { FastifyInstance } from 'fastify';
import { createCompanionRecord, updateCompanionRecord } from '../services/companionService.js';
import {
  createCompanionBodySchema,
  updateCompanionBodySchema,
  updateCompanionParamsSchema,
} from '../schemas/companions.js';
import { parseWithSchema } from '../schemas/utils.js';

export async function registerCompanionRoutes(app: FastifyInstance) {
  app.post('/api/companions', async (request) => {
    const body = parseWithSchema(createCompanionBodySchema, request.body);
    return createCompanionRecord(body);
  });

  app.patch('/api/companions/:id', async (request) => {
    const params = parseWithSchema(updateCompanionParamsSchema, request.params);
    const body = parseWithSchema(updateCompanionBodySchema, request.body);
    return updateCompanionRecord(params.id, body);
  });
}
