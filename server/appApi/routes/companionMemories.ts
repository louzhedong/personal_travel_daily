import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { companionMemoryParamsSchema } from '../schemas/companionMemories.js';
import { parseWithSchema } from '../schemas/utils.js';
import { getCompanionMemory, refreshCompanionMemory } from '../services/companionMemoryService.js';

export async function registerCompanionMemoryRoutes(app: FastifyInstance) {
  app.get('/api/companions/:id/memories', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(companionMemoryParamsSchema, request.params);
    return getCompanionMemory(account.id, params.id);
  });

  app.post('/api/companions/:id/memories/refresh', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(companionMemoryParamsSchema, request.params);
    return refreshCompanionMemory(account.id, params.id);
  });
}
