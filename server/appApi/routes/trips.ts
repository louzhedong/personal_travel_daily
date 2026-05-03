import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { parseWithSchema } from '../schemas/utils.js';
import {
  createTripBodySchema,
  tripParamsSchema,
  updateTripBodySchema,
} from '../schemas/trips.js';
import {
  createTripChecklistItemBodySchema,
  generateTripChecklistBodySchema,
  tripChecklistItemParamsSchema,
  updateTripChecklistItemBodySchema,
} from '../schemas/tripChecklist.js';
import {
  convertTripPlanningItemBodySchema,
  createTripPlanningItemBodySchema,
  tripPlanningItemParamsSchema,
  updateTripPlanningItemBodySchema,
} from '../schemas/tripPlanning.js';
import {
  createTripCollection,
  deleteTripCollection,
  updateTripCollection,
} from '../services/tripService.js';
import { getTripDetail } from '../services/tripDetailService.js';
import {
  createTripChecklistItemResource,
  deleteTripChecklistItemResource,
  generateTripChecklist,
  listTripChecklist,
  updateTripChecklistItemResource,
} from '../services/tripChecklistService.js';
import {
  convertTripPlanningItemToMarker,
  createTripPlanningItemResource,
  deleteTripPlanningItemResource,
  listTripPlanning,
  updateTripPlanningItemResource,
} from '../services/tripPlanningService.js';

export async function registerTripRoutes(app: FastifyInstance) {
  app.get('/api/trips/:id/detail', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(tripParamsSchema, request.params);
    return getTripDetail(account.id, params.id);
  });

  app.get('/api/trips/:id/checklist', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(tripParamsSchema, request.params);
    return listTripChecklist(account.id, params.id);
  });

  app.get('/api/trips/:id/planning', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(tripParamsSchema, request.params);
    return listTripPlanning(account.id, params.id);
  });

  app.post('/api/trips/:id/planning/items', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(tripParamsSchema, request.params);
    const body = parseWithSchema(createTripPlanningItemBodySchema, request.body);
    return createTripPlanningItemResource(account.id, params.id, body);
  });

  app.patch('/api/trips/:id/planning/items/:itemId', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(tripPlanningItemParamsSchema, request.params);
    const body = parseWithSchema(updateTripPlanningItemBodySchema, request.body);
    return updateTripPlanningItemResource(account.id, params.id, params.itemId, body);
  });

  app.delete('/api/trips/:id/planning/items/:itemId', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(tripPlanningItemParamsSchema, request.params);
    return deleteTripPlanningItemResource(account.id, params.id, params.itemId);
  });

  app.post('/api/trips/:id/planning/items/:itemId/convert-to-marker', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(tripPlanningItemParamsSchema, request.params);
    const body = parseWithSchema(convertTripPlanningItemBodySchema, request.body);
    return convertTripPlanningItemToMarker(account.id, params.id, params.itemId, body);
  });

  app.post('/api/trips/:id/checklist/generate', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(tripParamsSchema, request.params);
    const body = parseWithSchema(generateTripChecklistBodySchema, request.body);
    return generateTripChecklist(account.id, params.id, body);
  });

  app.post('/api/trips/:id/checklist/items', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(tripParamsSchema, request.params);
    const body = parseWithSchema(createTripChecklistItemBodySchema, request.body);
    return createTripChecklistItemResource(account.id, params.id, body);
  });

  app.patch('/api/trips/:id/checklist/items/:itemId', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(tripChecklistItemParamsSchema, request.params);
    const body = parseWithSchema(updateTripChecklistItemBodySchema, request.body);
    return updateTripChecklistItemResource(account.id, params.id, params.itemId, body);
  });

  app.delete('/api/trips/:id/checklist/items/:itemId', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(tripChecklistItemParamsSchema, request.params);
    return deleteTripChecklistItemResource(account.id, params.id, params.itemId);
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
