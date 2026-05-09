import { hashPassword, verifyPassword } from '../auth/password.js';
import { hashSessionToken } from '../auth/session.js';
import { createNotFoundError, createUnauthorizedError, createValidationError } from '../errors.js';
import { getPrismaClient } from '../prisma.js';
import {
  deleteAccountSessionById,
  deleteAccountSessionsExceptTokenHash,
  deleteAllAccountSessions,
  findAccountSessionById,
  findAccountSettingsById,
  listActiveAccountSessions,
  updateAccountName,
  updateAccountPasswordHash,
} from '../repositories/accountSettingsRepository.js';
import type {
  AccountSessionDto,
  ChangePasswordInputDto,
  UpdateAccountProfileInputDto,
} from '../types.js';

function serializeAccount(account: { id: string; name: string; username: string; role: 'admin' | 'member' }) {
  return {
    id: account.id,
    name: account.name,
    username: account.username,
    role: account.role,
  };
}

function getDeviceLabel(userAgent: string | null) {
  if (!userAgent) {
    return '未知设备';
  }

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return 'iOS 设备';
  }
  if (/Android/i.test(userAgent)) {
    return 'Android 设备';
  }
  if (/Macintosh|Mac OS X/i.test(userAgent)) {
    return 'Mac 浏览器';
  }
  if (/Windows/i.test(userAgent)) {
    return 'Windows 浏览器';
  }
  return '浏览器会话';
}

function serializeSession(
  session: {
    id: string;
    tokenHash: string;
    userAgent: string | null;
    ipAddress: string | null;
    createdAt: Date;
    lastSeenAt: Date;
    expiresAt: Date;
  },
  currentTokenHash: string | null,
): AccountSessionDto {
  return {
    id: session.id,
    isCurrent: !!currentTokenHash && session.tokenHash === currentTokenHash,
    userAgent: session.userAgent ?? undefined,
    deviceLabel: getDeviceLabel(session.userAgent),
    ipAddress: session.ipAddress ?? undefined,
    createdAt: session.createdAt.toISOString(),
    lastSeenAt: session.lastSeenAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
  };
}

function getCurrentTokenHash(currentToken: string | null) {
  return currentToken ? hashSessionToken(currentToken) : null;
}

export async function getAccountSettings(accountId: string) {
  const prisma = getPrismaClient();
  const account = await findAccountSettingsById(prisma, accountId);
  if (!account) {
    throw createNotFoundError('account not found');
  }

  return {
    account: serializeAccount(account),
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}

export async function updateAccountProfile(accountId: string, input: UpdateAccountProfileInputDto) {
  const prisma = getPrismaClient();
  const account = await updateAccountName(prisma, accountId, input.name.trim());
  return {
    account: serializeAccount(account),
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}

export async function changeAccountPassword(
  accountId: string,
  currentToken: string | null,
  input: ChangePasswordInputDto,
) {
  const prisma = getPrismaClient();
  const account = await findAccountSettingsById(prisma, accountId);
  if (!account) {
    throw createNotFoundError('account not found');
  }

  if (!(await verifyPassword(input.currentPassword, account.passwordHash))) {
    throw createUnauthorizedError('current password is invalid');
  }

  const currentTokenHash = getCurrentTokenHash(currentToken);
  await prisma.$transaction(async (tx) => {
    await updateAccountPasswordHash(tx, accountId, await hashPassword(input.nextPassword));
    if (currentTokenHash) {
      await deleteAccountSessionsExceptTokenHash(tx, accountId, currentTokenHash);
    } else {
      await deleteAllAccountSessions(tx, accountId);
    }
  });

  return { success: true as const };
}

export async function listAccountSessions(accountId: string, currentToken: string | null) {
  const prisma = getPrismaClient();
  const currentTokenHash = getCurrentTokenHash(currentToken);
  const sessions = await listActiveAccountSessions(prisma, accountId, new Date());
  return {
    sessions: sessions.map((session) => serializeSession(session, currentTokenHash)),
  };
}

export async function revokeAccountSession(
  accountId: string,
  sessionId: string,
  currentToken: string | null,
) {
  const prisma = getPrismaClient();
  const currentTokenHash = getCurrentTokenHash(currentToken);
  const session = await findAccountSessionById(prisma, accountId, sessionId);
  if (!session) {
    throw createNotFoundError('session not found');
  }

  if (currentTokenHash && session.tokenHash === currentTokenHash) {
    throw createValidationError('use logout for current session');
  }

  await deleteAccountSessionById(prisma, accountId, sessionId);
  return { success: true as const };
}

export async function logoutAllAccountSessions(accountId: string) {
  const prisma = getPrismaClient();
  await deleteAllAccountSessions(prisma, accountId);
  return { success: true as const };
}
