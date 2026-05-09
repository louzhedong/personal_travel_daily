import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import {
  photoCurationQuerySchema,
  updatePhotoCurationBodySchema,
} from '../schemas/photoCuration.js';
import { parseWithSchema } from '../schemas/utils.js';
import {
  listPhotoCurationResource,
  updatePhotoCurationResource,
} from '../services/photoCurationService.js';

export async function registerPhotoCurationRoutes(app: FastifyInstance) {
  app.get('/api/photos/curation', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const query = parseWithSchema(photoCurationQuerySchema, request.query);

    return listPhotoCurationResource(account.id, query);
  });

  app.patch('/api/photos/curation', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const query = parseWithSchema(photoCurationQuerySchema, request.query);
    const body = parseWithSchema(updatePhotoCurationBodySchema, request.body);

    return updatePhotoCurationResource(account.id, body, query);
  });
}
