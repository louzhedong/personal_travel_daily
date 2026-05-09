import { randomUUID } from 'node:crypto';
import { hashPassword, verifyPassword } from '../auth/password.js';
import {
  createSessionToken,
  getSessionExpiresAt,
  hashSessionToken,
} from '../auth/session.js';
import { createConflictError, createUnauthorizedError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import { createAccount, findAccountByUsername } from '../repositories/accountRepository.js';
import { createAuthSession, deleteAuthSessionByTokenHash } from '../repositories/authSessionRepository.js';
import type { LoginBody, RegisterBody } from '../schemas/auth.js';
import { createInitialAccountState } from './appContextService.js';

export interface SessionClientMetadata {
  userAgent?: string | null;
  ipAddress?: string | null;
}

function serializeAccount(account: { id: string; name: string; username: string; role: 'admin' | 'member' }) {
  return {
    id: account.id,
    name: account.name,
    username: account.username,
    role: account.role,
  };
}

export async function registerAccount(input: RegisterBody, metadata: SessionClientMetadata = {}) {
  const prisma = getPrismaClient();
  const username = input.username.trim();
  const nickname = input.nickname.trim();

  const result = await prisma.$transaction(async (tx) => {
    const existing = await findAccountByUsername(tx, username);
    if (existing) {
      throw createConflictError('username already exists');
    }

    const account = await createAccount(tx, {
      id: randomUUID(),
      name: nickname,
      username,
      role: 'member',
      passwordHash: await hashPassword(input.password),
    });

    await createInitialAccountState(tx, account.id, {
      primaryCompanionName: nickname,
      singleCompanion: true,
    });

    const sessionToken = createSessionToken();
    const expiresAt = getSessionExpiresAt();
    await createAuthSession(tx, {
      id: randomUUID(),
      accountId: account.id,
      tokenHash: hashSessionToken(sessionToken),
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
      expiresAt,
    });

    return {
      account: serializeAccount(account),
      sessionToken,
      expiresAt,
    };
  });

  return result;
}

export async function loginAccount(input: LoginBody, metadata: SessionClientMetadata = {}) {
  const prisma = getPrismaClient();
  const account = await findAccountByUsername(prisma, input.username.trim());

  if (!account || !(await verifyPassword(input.password, account.passwordHash))) {
    throw createUnauthorizedError('invalid username or password');
  }

  const sessionToken = createSessionToken();
  const expiresAt = getSessionExpiresAt();

  await prisma.$transaction(async (tx) => {
    await createAuthSession(tx, {
      id: randomUUID(),
      accountId: account.id,
      tokenHash: hashSessionToken(sessionToken),
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
      expiresAt,
    });
  });

  return {
    account: serializeAccount(account),
    sessionToken,
    expiresAt,
  };
}

export async function logoutAccount(sessionToken: string | null) {
  if (!sessionToken) {
    return;
  }

  const prisma = getPrismaClient();
  await deleteAuthSessionByTokenHash(prisma, hashSessionToken(sessionToken));
}
