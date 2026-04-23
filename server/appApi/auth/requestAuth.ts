import type { FastifyRequest } from 'fastify';
import { createForbiddenError, createUnauthorizedError } from '../errors.js';
import { SESSION_COOKIE_NAME, hashSessionToken, readCookieValue } from './session.js';
import { getPrismaClient } from '../prisma.js';
import { deleteExpiredAuthSessions, findAuthSessionByTokenHash } from '../repositories/authSessionRepository.js';

export interface AuthenticatedAccount {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'member';
}

export async function getAuthenticatedAccount(request: FastifyRequest) {
  const sessionToken = readCookieValue(request.headers.cookie, SESSION_COOKIE_NAME);
  if (!sessionToken) {
    return null;
  }

  const prisma = getPrismaClient();
  const now = new Date();
  await deleteExpiredAuthSessions(prisma, now);

  const session = await findAuthSessionByTokenHash(prisma, hashSessionToken(sessionToken));
  if (!session || session.expiresAt <= now) {
    return null;
  }

  return {
    id: session.account.id,
    name: session.account.name,
    username: session.account.username,
    role: session.account.role,
  } satisfies AuthenticatedAccount;
}

export async function requireAuthenticatedAccount(request: FastifyRequest) {
  const account = await getAuthenticatedAccount(request);
  if (!account) {
    throw createUnauthorizedError('authentication required');
  }

  return account;
}

export async function requireAdminAccount(request: FastifyRequest) {
  const account = await requireAuthenticatedAccount(request);
  if (account.role !== 'admin') {
    throw createForbiddenError('admin access required');
  }

  return account;
}
