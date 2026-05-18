import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import {
  createMarkerTagVocabularyBodySchema,
  markerTagVocabularyParamsSchema,
  updateMarkerTagVocabularyBodySchema,
} from '../schemas/tagVocabulary.js';
import { parseWithSchema } from '../schemas/utils.js';
import {
  createMarkerTagVocabulary,
  deleteMarkerTagVocabulary,
  listMarkerTagVocabulary,
  updateMarkerTagVocabulary,
} from '../services/tagVocabularyService.js';

export async function registerTagVocabularyRoutes(app: FastifyInstance) {
  app.get('/api/marker-tags/vocabulary', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    return listMarkerTagVocabulary(account.id);
  });

  app.post('/api/marker-tags/vocabulary', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(createMarkerTagVocabularyBodySchema, request.body);
    return createMarkerTagVocabulary(account.id, body);
  });

  app.patch('/api/marker-tags/vocabulary/:value', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(markerTagVocabularyParamsSchema, request.params);
    const body = parseWithSchema(updateMarkerTagVocabularyBodySchema, request.body);
    return updateMarkerTagVocabulary(account.id, params.value, body);
  });

  app.delete('/api/marker-tags/vocabulary/:value', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(markerTagVocabularyParamsSchema, request.params);
    return deleteMarkerTagVocabulary(account.id, params.value);
  });
}
