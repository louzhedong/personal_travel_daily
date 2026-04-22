import type { FastifyInstance } from 'fastify';
import { getBootstrapPayload } from '../services/bootstrapService.js';

export async function registerBootstrapRoutes(app: FastifyInstance) {
  app.get('/api/app/bootstrap', async () => {
    return getBootstrapPayload();
  });
}
