import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { createMarkerRecord, deleteMarkerRecord, updateMarkerRecord } from '../services/markerService.js';
import {
  createMarkerBodySchema,
  markerParamsSchema,
  updateMarkerBodySchema,
} from '../schemas/markers.js';
import { parseWithSchema } from '../schemas/utils.js';

export async function registerMarkerRoutes(app: FastifyInstance) {
  app.post('/api/markers', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(createMarkerBodySchema, request.body);
    return createMarkerRecord(account.id, body);
  });

  app.patch('/api/markers/:id', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(markerParamsSchema, request.params);
    const body = parseWithSchema(updateMarkerBodySchema, request.body);
    return updateMarkerRecord(account.id, params.id, body);
  });

  app.delete('/api/markers/:id', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(markerParamsSchema, request.params);
    return deleteMarkerRecord(account.id, params.id);
  });
}
