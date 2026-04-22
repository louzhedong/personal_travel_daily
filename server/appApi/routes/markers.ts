import type { FastifyInstance } from 'fastify';
import { createMarkerRecord, deleteMarkerRecord, updateMarkerRecord } from '../services/markerService.js';
import {
  createMarkerBodySchema,
  markerParamsSchema,
  updateMarkerBodySchema,
} from '../schemas/markers.js';
import { parseWithSchema } from '../schemas/utils.js';

export async function registerMarkerRoutes(app: FastifyInstance) {
  app.post('/api/markers', async (request) => {
    const body = parseWithSchema(createMarkerBodySchema, request.body);
    return createMarkerRecord(body);
  });

  app.patch('/api/markers/:id', async (request) => {
    const params = parseWithSchema(markerParamsSchema, request.params);
    const body = parseWithSchema(updateMarkerBodySchema, request.body);
    return updateMarkerRecord(params.id, body);
  });

  app.delete('/api/markers/:id', async (request) => {
    const params = parseWithSchema(markerParamsSchema, request.params);
    return deleteMarkerRecord(params.id);
  });
}
