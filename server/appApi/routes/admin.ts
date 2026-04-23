import type { FastifyInstance } from 'fastify';
import { requireAdminAccount } from '../auth/requestAuth.js';
import { parseWithSchema } from '../schemas/utils.js';
import { adminOverviewQuerySchema } from '../schemas/admin.js';
import { getAdminOverview } from '../services/adminService.js';

export async function registerAdminRoutes(app: FastifyInstance) {
  app.get('/api/admin/overview', async (request) => {
    await requireAdminAccount(request);
    parseWithSchema(adminOverviewQuerySchema, request.query);
    return getAdminOverview();
  });
}
