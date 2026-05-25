import type { FastifyInstance, FastifyReply } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import {
  acceptContributionInboxBodySchema,
  contributionDropBoxParamsSchema,
  contributionInboxParamsSchema,
  contributionPublicSlugParamsSchema,
  contributionPublicSubmitBodySchema,
  createContributionDropBoxBodySchema,
} from '../schemas/contribution.js';
import { parseWithSchema } from '../schemas/utils.js';
import {
  acceptInboxItem,
  createDropBox,
  getPublicDropBoxMeta,
  listDropBoxes,
  listInbox,
  readInboxItemImage,
  rejectInboxItem,
  revokeDropBox,
  submitToDropBox,
} from '../services/contributionDropService.js';

/**
 * G4 · Companion Contribution Drop-Box routes / 旅伴匿名只写贡献链接路由
 * 私有路由：管理 dropbox + 审核 inbox。
 * 公开路由：/c/:slug/meta + /c/:slug/submit （只写不读）。
 */
export async function registerContributionRoutes(app: FastifyInstance) {
  // 私有：drop boxes ----------------------------------------------------------
  app.post('/api/contribution/drops', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(createContributionDropBoxBodySchema, request.body ?? {});
    return createDropBox(account, body);
  });

  app.get('/api/contribution/drops', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    return listDropBoxes(account);
  });

  app.delete('/api/contribution/drops/:dropBoxId', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(contributionDropBoxParamsSchema, request.params);
    return revokeDropBox(account, params.dropBoxId);
  });

  // 私有：inbox ---------------------------------------------------------------
  app.get('/api/contribution/inbox', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    return listInbox(account);
  });

  app.get('/api/contribution/inbox/:itemId/image', async (request, reply: FastifyReply) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(contributionInboxParamsSchema, request.params);
    const { bytes, mimeType } = await readInboxItemImage(account, params.itemId);
    reply.header('Content-Type', mimeType);
    return reply.send(bytes);
  });

  app.post('/api/contribution/inbox/:itemId/accept', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(contributionInboxParamsSchema, request.params);
    const body = parseWithSchema(acceptContributionInboxBodySchema, request.body ?? {});
    return acceptInboxItem(account, params.itemId, body);
  });

  app.post('/api/contribution/inbox/:itemId/reject', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(contributionInboxParamsSchema, request.params);
    return rejectInboxItem(account, params.itemId);
  });

  // 公开：drop page (write-only) ---------------------------------------------
  app.get('/c/:slug/meta', async (request) => {
    const params = parseWithSchema(contributionPublicSlugParamsSchema, request.params);
    return getPublicDropBoxMeta(params.slug);
  });

  app.post('/c/:slug/submit', async (request) => {
    const params = parseWithSchema(contributionPublicSlugParamsSchema, request.params);
    const body = parseWithSchema(contributionPublicSubmitBodySchema, request.body ?? {});
    return submitToDropBox(params.slug, body);
  });
}
