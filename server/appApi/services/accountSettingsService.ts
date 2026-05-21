import { hashPassword, verifyPassword } from '../auth/password.js';
import { randomUUID } from 'node:crypto';
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
  UpdateAccountPreferenceInputDto,
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

const DEFAULT_ACCOUNT_PREFERENCE = {
  locale: 'zh-CN' as const,
  mapStyle: 'magazine' as const,
  defaultCurrency: 'CNY',
  commonCurrencies: ['CNY', 'JPY', 'USD', 'EUR'],
  exchangeRateSource: 'exchangerate-host',
};

function serializePreference(preference: {
  locale: string;
  mapStyle: string;
  defaultCurrency: string;
  commonCurrencies: unknown;
  exchangeRateSource: string;
} | null) {
  const commonCurrencies = Array.isArray(preference?.commonCurrencies)
    ? preference.commonCurrencies.filter((item): item is string => typeof item === 'string')
    : DEFAULT_ACCOUNT_PREFERENCE.commonCurrencies;
  return {
    locale: (preference?.locale === 'en-US' ? 'en-US' : 'zh-CN') as 'zh-CN' | 'en-US',
    mapStyle: (['minimal', 'magazine', 'old-map'].includes(preference?.mapStyle ?? '') ? preference?.mapStyle : 'magazine') as 'minimal' | 'magazine' | 'old-map',
    defaultCurrency: preference?.defaultCurrency ?? DEFAULT_ACCOUNT_PREFERENCE.defaultCurrency,
    commonCurrencies,
    exchangeRateSource: preference?.exchangeRateSource ?? DEFAULT_ACCOUNT_PREFERENCE.exchangeRateSource,
  };
}

async function findAccountPreference(prisma: ReturnType<typeof getPrismaClient>, accountId: string) {
  if (!('accountPreference' in prisma) || !prisma.accountPreference) {
    return null;
  }
  return prisma.accountPreference.findUnique({ where: { accountId } });
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
    preference: serializePreference(await findAccountPreference(prisma, accountId)),
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}

export async function updateAccountProfile(accountId: string, input: UpdateAccountProfileInputDto) {
  const prisma = getPrismaClient();
  const account = await updateAccountName(prisma, accountId, input.name.trim());
  return {
    account: serializeAccount(account),
    preference: serializePreference(await findAccountPreference(prisma, accountId)),
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}

export async function updateAccountPreference(accountId: string, input: UpdateAccountPreferenceInputDto) {
  const prisma = getPrismaClient();
  const preference = await prisma.accountPreference.upsert({
    where: { accountId },
    create: {
      id: randomUUID(),
      accountId,
      locale: input.locale ?? DEFAULT_ACCOUNT_PREFERENCE.locale,
      mapStyle: input.mapStyle ?? DEFAULT_ACCOUNT_PREFERENCE.mapStyle,
      defaultCurrency: input.defaultCurrency ?? DEFAULT_ACCOUNT_PREFERENCE.defaultCurrency,
      commonCurrencies: input.commonCurrencies ?? DEFAULT_ACCOUNT_PREFERENCE.commonCurrencies,
      exchangeRateSource: input.exchangeRateSource ?? DEFAULT_ACCOUNT_PREFERENCE.exchangeRateSource,
    },
    update: {
      locale: input.locale,
      mapStyle: input.mapStyle,
      defaultCurrency: input.defaultCurrency,
      commonCurrencies: input.commonCurrencies,
      exchangeRateSource: input.exchangeRateSource,
    },
  });
  const account = await findAccountSettingsById(prisma, accountId);
  if (!account) {
    throw createNotFoundError('account not found');
  }
  return {
    account: serializeAccount(account),
    preference: serializePreference(preference),
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
