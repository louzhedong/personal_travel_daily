import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { createCompanionRecord, updateCompanionRecord } from '../services/companionService.js';
import {
  createCompanionBodySchema,
  updateCompanionBodySchema,
  updateCompanionParamsSchema,
} from '../schemas/companions.js';
import { parseWithSchema } from '../schemas/utils.js';

export async function registerCompanionRoutes(app: FastifyInstance) {
  app.post('/api/companions', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(createCompanionBodySchema, request.body);
    return createCompanionRecord(account.id, body);
  });

  app.patch('/api/companions/:id', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(updateCompanionParamsSchema, request.params);
    const body = parseWithSchema(updateCompanionBodySchema, request.body);
    return updateCompanionRecord(account.id, params.id, body);
  });
}
