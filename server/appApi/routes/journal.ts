import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import {
  acceptJournalDraftBodySchema,
  generateJournalDraftBodySchema,
  journalListQuerySchema,
  journalParamsSchema,
  upsertJournalEntryBodySchema,
} from '../schemas/journal.js';
import { parseWithSchema } from '../schemas/utils.js';
import {
  acceptJournalDraft,
  deleteJournalEntry,
  generateJournalDraft,
  listJournalEntries,
  upsertJournalEntry,
} from '../services/journalService.js';

/**
 * F3 · Journal routes / 智能日记路由
 */
export async function registerJournalRoutes(app: FastifyInstance) {
  app.get('/api/journal', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const query = parseWithSchema(journalListQuerySchema, request.query ?? {});
    return listJournalEntries(account, query);
  });

  app.put('/api/journal', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(upsertJournalEntryBodySchema, request.body ?? {});
    return upsertJournalEntry(account, body);
  });

  app.post('/api/journal/draft', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(generateJournalDraftBodySchema, request.body ?? {});
    return generateJournalDraft(account, body);
  });

  app.post('/api/journal/draft/accept', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(acceptJournalDraftBodySchema, request.body ?? {});
    return acceptJournalDraft(account, body);
  });

  app.delete('/api/journal/:entryId', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(journalParamsSchema, request.params);
    return deleteJournalEntry(account, params.entryId);
  });
}
