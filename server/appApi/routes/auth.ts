import type { FastifyInstance, FastifyRequest } from 'fastify';
import { getAuthenticatedAccount } from '../auth/requestAuth.js';
import {
  SESSION_COOKIE_NAME,
  readCookieValue,
  serializeSessionCookie,
  serializeSessionCookieClear,
} from '../auth/session.js';
import { parseWithSchema } from '../schemas/utils.js';
import { loginBodySchema, registerBodySchema } from '../schemas/auth.js';
import { loginAccount, logoutAccount, registerAccount } from '../services/authService.js';

function getSessionClientMetadata(request: FastifyRequest) {
  const userAgent = request.headers['user-agent'];
  return {
    userAgent: Array.isArray(userAgent) ? userAgent.join(' ') : userAgent,
    ipAddress: request.ip,
  };
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.get('/api/auth/session', async (request) => {
    const account = await getAuthenticatedAccount(request);

    if (!account) {
      return { account: null };
    }

    return { account };
  });

  app.post('/api/auth/register', async (request, reply) => {
    const body = parseWithSchema(registerBodySchema, request.body);
    const result = await registerAccount(body, getSessionClientMetadata(request));
    reply.header('Set-Cookie', serializeSessionCookie(result.sessionToken, result.expiresAt));
    return {
      account: result.account,
    };
  });

  app.post('/api/auth/login', async (request, reply) => {
    const body = parseWithSchema(loginBodySchema, request.body);
    const result = await loginAccount(body, getSessionClientMetadata(request));
    reply.header('Set-Cookie', serializeSessionCookie(result.sessionToken, result.expiresAt));
    return {
      account: result.account,
    };
  });

  app.post('/api/auth/logout', async (request, reply) => {
    await logoutAccount(readCookieValue(request.headers.cookie, SESSION_COOKIE_NAME));
    reply.header('Set-Cookie', serializeSessionCookieClear());
    return {
      success: true,
    };
  });
}
