import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { organizationActionBodySchema } from '../schemas/organization.js';
import { parseWithSchema } from '../schemas/utils.js';
import {
  applyOrganizationAction,
  getOrganizationWorkbench,
  previewOrganizationAction,
} from '../services/organizationWorkbenchService.js';

export async function registerOrganizationRoutes(app: FastifyInstance) {
  app.get('/api/organization/workbench', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    return getOrganizationWorkbench(account.id);
  });

  app.post('/api/organization/actions/preview', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(organizationActionBodySchema, request.body);
    return previewOrganizationAction(account.id, body);
  });

  app.post('/api/organization/actions/apply', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(organizationActionBodySchema, request.body);
    return applyOrganizationAction(account.id, body);
  });
}

