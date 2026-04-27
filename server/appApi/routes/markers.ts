import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import {
  batchUpdateMarkersTrip,
  createMarkerRecord,
  deleteMarkerRecord,
  searchMarkerRecords,
  updateMarkerRecord,
} from '../services/markerService.js';
import {
  batchUpdateMarkersTripBodySchema,
  createMarkerBodySchema,
  markerParamsSchema,
  searchMarkersQuerySchema,
  updateMarkerBodySchema,
} from '../schemas/markers.js';
import { parseWithSchema } from '../schemas/utils.js';

export async function registerMarkerRoutes(app: FastifyInstance) {
  app.get('/api/markers/search', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const query = parseWithSchema(searchMarkersQuerySchema, request.query);
    return searchMarkerRecords(account.id, query);
  });

  app.post('/api/markers', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(createMarkerBodySchema, request.body);
    return createMarkerRecord(account.id, body);
  });

  app.patch('/api/markers/batch-trip', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(batchUpdateMarkersTripBodySchema, request.body);
    return batchUpdateMarkersTrip(account.id, body);
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
