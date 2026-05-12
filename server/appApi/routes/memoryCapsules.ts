import type { FastifyInstance } from 'fastify';
import { requireAuthenticatedAccount } from '../auth/requestAuth.js';
import {
  createMemoryCapsuleBodySchema,
  listMemoryCapsulesQuerySchema,
  memoryCapsuleParamsSchema,
  updateMemoryCapsuleBodySchema,
} from '../schemas/memoryCapsules.js';
import { parseWithSchema } from '../schemas/utils.js';
import {
  archiveAccountMemoryCapsule,
  createAccountMemoryCapsule,
  duplicateAccountMemoryCapsule,
  getAccountMemoryCapsule,
  listAccountMemoryCapsules,
  updateAccountMemoryCapsule,
} from '../services/memoryCapsuleService.js';

export async function registerMemoryCapsuleRoutes(app: FastifyInstance) {
  app.get('/api/memory-capsules', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const query = parseWithSchema(listMemoryCapsulesQuerySchema, request.query);
    return listAccountMemoryCapsules(account, query);
  });

  app.post('/api/memory-capsules', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const body = parseWithSchema(createMemoryCapsuleBodySchema, request.body);
    return createAccountMemoryCapsule(account, body);
  });

  app.get('/api/memory-capsules/:id', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(memoryCapsuleParamsSchema, request.params);
    return getAccountMemoryCapsule(account, params.id);
  });

  app.patch('/api/memory-capsules/:id', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(memoryCapsuleParamsSchema, request.params);
    const body = parseWithSchema(updateMemoryCapsuleBodySchema, request.body);
    return updateAccountMemoryCapsule(account, params.id, body);
  });

  app.post('/api/memory-capsules/:id/duplicate', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(memoryCapsuleParamsSchema, request.params);
    return duplicateAccountMemoryCapsule(account, params.id);
  });

  app.post('/api/memory-capsules/:id/archive', async (request) => {
    const account = await requireAuthenticatedAccount(request);
    const params = parseWithSchema(memoryCapsuleParamsSchema, request.params);
    return archiveAccountMemoryCapsule(account, params.id);
  });
}
