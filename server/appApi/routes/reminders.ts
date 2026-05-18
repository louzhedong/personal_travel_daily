import type { FastifyInstance } from 'fastify';
import { requireAdminAccount, requireAuthenticatedAccount } from '../auth/requestAuth.js';
import {
  muteReminderBodySchema,
  reminderParamsSchema,
  reminderPreferenceParamsSchema,
} from '../schemas/reminders.js';
import { parseWithSchema } from '../schemas/utils.js';
import {
  getAdminReminderTrends,
  listAccountReminders,
  muteAccountReminderType,
  resolveAccountReminder,
  unmuteAccountReminderType,
} from '../services/reminderService.js';

export async function registerReminderRoutes(app: FastifyInstance) {
  app.get('/api/reminders', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    return listAccountReminders(account);
  });

  app.post('/api/reminders/:fingerprint/resolve', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(reminderParamsSchema, request.params);
    return resolveAccountReminder(account, params.fingerprint);
  });

  app.post('/api/reminders/preferences/:type/mute', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(reminderPreferenceParamsSchema, request.params);
    const body = parseWithSchema(muteReminderBodySchema, request.body ?? {});
    return muteAccountReminderType(account, params.type, body.mutedUntil);
  });

  app.delete('/api/reminders/preferences/:type/mute', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(reminderPreferenceParamsSchema, request.params);
    return unmuteAccountReminderType(account, params.type);
  });

  app.get('/api/admin/reminders/trends', async (request) => {
    await requireAdminAccount(request);
    return getAdminReminderTrends();
  });
}
