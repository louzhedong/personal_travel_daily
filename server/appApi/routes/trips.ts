import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { parseWithSchema } from '../schemas/utils.js';
import {
  createTripBodySchema,
  tripParamsSchema,
  updateTripBodySchema,
} from '../schemas/trips.js';
import {
  createTripCollection,
  deleteTripCollection,
  updateTripCollection,
} from '../services/tripService.js';
import { getTripDetail } from '../services/tripDetailService.js';

export async function registerTripRoutes(app: FastifyInstance) {
  app.get('/api/trips/:id/detail', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(tripParamsSchema, request.params);
    return getTripDetail(account.id, params.id);
  });

  app.post('/api/trips', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(createTripBodySchema, request.body);
    return createTripCollection(account.id, body);
  });

  app.patch('/api/trips/:id', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(tripParamsSchema, request.params);
    const body = parseWithSchema(updateTripBodySchema, request.body);
    return updateTripCollection(account.id, params.id, body);
  });

  app.delete('/api/trips/:id', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(tripParamsSchema, request.params);
    return deleteTripCollection(account.id, params.id);
  });
}
