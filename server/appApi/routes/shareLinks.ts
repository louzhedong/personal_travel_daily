import type { FastifyInstance, FastifyRequest } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import {
  createShareLinkBodySchema,
  publicShareAccessBodySchema,
  publicShareTokenParamsSchema,
  shareLinkParamsSchema,
  updateShareLinkBodySchema,
} from '../schemas/shareLinks.js';
import { parseWithSchema } from '../schemas/utils.js';
import {
  accessPublicPrivateShareLink,
  createAccountPrivateShareLink,
  listAccountPrivateShareLinks,
  revokeAccountPrivateShareLink,
  updateAccountPrivateShareLink,
} from '../services/shareLinkService.js';

function getAccessMeta(request: FastifyRequest) {
  const userAgent = request.headers['user-agent'];
  return {
    ipAddress: request.ip,
    userAgent: Array.isArray(userAgent) ? userAgent.join(', ') : userAgent,
  };
}

export async function registerShareLinkRoutes(app: FastifyInstance) {
  app.get('/api/share-links', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    return listAccountPrivateShareLinks(account);
  });

  app.post('/api/share-links', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(createShareLinkBodySchema, request.body);
    return createAccountPrivateShareLink(account, body);
  });

  app.patch('/api/share-links/:id', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(shareLinkParamsSchema, request.params);
    const body = parseWithSchema(updateShareLinkBodySchema, request.body);
    return updateAccountPrivateShareLink(account, params.id, body);
  });

  app.post('/api/share-links/:id/revoke', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(shareLinkParamsSchema, request.params);
    return revokeAccountPrivateShareLink(account, params.id);
  });

  app.post('/api/public/share-links/:token/access', async (request) => {
    const params = parseWithSchema(publicShareTokenParamsSchema, request.params);
    const body = parseWithSchema(publicShareAccessBodySchema, request.body ?? {});
    return accessPublicPrivateShareLink(params.token, body, getAccessMeta(request));
  });
}
