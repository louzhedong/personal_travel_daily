import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { assistantSuggestionParamsSchema, confirmAssistantSuggestionBodySchema, createAssistantSuggestionBodySchema, updateAssistantPreferenceBodySchema } from '../schemas/assistant.js';
import { parseWithSchema } from '../schemas/utils.js';
import { confirmAssistantSuggestion, createAssistantSuggestion, dismissAssistantSuggestion, getAssistantPreference, listAssistantSuggestions, updateAssistantPreference } from '../services/assistantService.js';

export async function registerAssistantRoutes(app: FastifyInstance) {
  app.get('/api/assistant/preference', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    return getAssistantPreference(account);
  });

  app.patch('/api/assistant/preference', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(updateAssistantPreferenceBodySchema, request.body);
    return updateAssistantPreference(account, body);
  });

  app.post('/api/assistant/suggestions', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(createAssistantSuggestionBodySchema, request.body);
    return createAssistantSuggestion(account, body);
  });

  app.get('/api/assistant/suggestions', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    return listAssistantSuggestions(account);
  });

  app.post('/api/assistant/suggestions/:id/confirm', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(assistantSuggestionParamsSchema, request.params);
    parseWithSchema(confirmAssistantSuggestionBodySchema, request.body ?? {});
    return confirmAssistantSuggestion(account, params.id);
  });

  app.post('/api/assistant/suggestions/:id/dismiss', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(assistantSuggestionParamsSchema, request.params);
    return dismissAssistantSuggestion(account, params.id);
  });
}
