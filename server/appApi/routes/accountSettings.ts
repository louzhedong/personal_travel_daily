import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import { SESSION_COOKIE_NAME, readCookieValue, serializeSessionCookieClear } from '../auth/session.js';
import {
  accountSessionParamsSchema,
  changePasswordBodySchema,
  updateAccountProfileBodySchema,
} from '../schemas/accountSettings.js';
import { parseWithSchema } from '../schemas/utils.js';
import {
  changeAccountPassword,
  getAccountSettings,
  listAccountSessions,
  logoutAllAccountSessions,
  revokeAccountSession,
  updateAccountProfile,
} from '../services/accountSettingsService.js';

export async function registerAccountSettingsRoutes(app: FastifyInstance) {
  app.get('/api/account/settings', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    return getAccountSettings(account.id);
  });

  app.patch('/api/account/profile', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(updateAccountProfileBodySchema, request.body);
    return updateAccountProfile(account.id, body);
  });

  app.patch('/api/account/password', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(changePasswordBodySchema, request.body);
    return changeAccountPassword(
      account.id,
      readCookieValue(request.headers.cookie, SESSION_COOKIE_NAME),
      body,
    );
  });

  app.get('/api/account/sessions', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    return listAccountSessions(account.id, readCookieValue(request.headers.cookie, SESSION_COOKIE_NAME));
  });

  app.delete('/api/account/sessions/:sessionId', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(accountSessionParamsSchema, request.params);
    return revokeAccountSession(
      account.id,
      params.sessionId,
      readCookieValue(request.headers.cookie, SESSION_COOKIE_NAME),
    );
  });

  app.post('/api/account/sessions/logout-all', async (request, reply) => {
    const account = await requireAuthenticatedAccount(request);
    const result = await logoutAllAccountSessions(account.id);
    reply.header('Set-Cookie', serializeSessionCookieClear());
    return result;
  });
}
