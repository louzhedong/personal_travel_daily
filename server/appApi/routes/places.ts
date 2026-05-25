import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import {
  createPlaceBodySchema,
  placeListQuerySchema,
  placeParamsSchema,
  promoteMarkerToPlaceBodySchema,
  updatePlaceBodySchema,
} from '../schemas/places.js';
import { parseWithSchema } from '../schemas/utils.js';
import {
  createPlace,
  deletePlace,
  getPlace,
  listPlaces,
  promoteMarkerToPlace,
  updatePlace,
} from '../services/placeService.js';

/**
 * F2 · Place routes / 旅行知识库 Place 路由
 */
export async function registerPlaceRoutes(app: FastifyInstance) {
  app.get('/api/places', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const query = parseWithSchema(placeListQuerySchema, request.query ?? {});
    return listPlaces(account, query);
  });

  app.get('/api/places/:placeId', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(placeParamsSchema, request.params);
    return getPlace(account, params.placeId);
  });

  app.post('/api/places', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(createPlaceBodySchema, request.body ?? {});
    return createPlace(account, body);
  });

  app.patch('/api/places/:placeId', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(placeParamsSchema, request.params);
    const body = parseWithSchema(updatePlaceBodySchema, request.body ?? {});
    return updatePlace(account, params.placeId, body);
  });

  app.delete('/api/places/:placeId', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(placeParamsSchema, request.params);
    return deletePlace(account, params.placeId);
  });

  app.post('/api/places/promote', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(promoteMarkerToPlaceBodySchema, request.body ?? {});
    return promoteMarkerToPlace(account, body);
  });
}
