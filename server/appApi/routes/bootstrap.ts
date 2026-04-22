import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { getBootstrapPayload } from '../services/bootstrapService.js';

export async function registerBootstrapRoutes(app: FastifyInstance) {
  app.get('/api/app/bootstrap', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    return getBootstrapPayload(account);
  });
}
