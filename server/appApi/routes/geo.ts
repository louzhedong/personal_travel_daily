import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { enhanceMarkerGeoBodySchema, markerGeoParamsSchema, resolveGeoLookupBodySchema } from '../schemas/geo.js';
import { parseWithSchema } from '../schemas/utils.js';
import { enhanceMarkerGeo, resolveGeoLookup } from '../services/geoLookupService.js';

export async function registerGeoRoutes(app: FastifyInstance) {
  app.post('/api/geo/resolve', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(resolveGeoLookupBodySchema, request.body);
    return resolveGeoLookup(account, body);
  });

  app.post('/api/markers/:markerId/geo/enhance', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(markerGeoParamsSchema, request.params);
    const body = parseWithSchema(enhanceMarkerGeoBodySchema, request.body ?? {});
    return enhanceMarkerGeo(account, params.markerId, body.label);
  });
}
