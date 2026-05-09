import type { Prisma, PrismaClient } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function findAccountSettingsById(prisma: PrismaExecutor, accountId: string) {
  return prisma.account.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      passwordHash: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateAccountName(prisma: PrismaExecutor, accountId: string, name: string) {
  return prisma.account.update({
    where: { id: accountId },
    data: { name },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateAccountPasswordHash(
  prisma: PrismaExecutor,
  accountId: string,
  passwordHash: string,
) {
  return prisma.account.update({
    where: { id: accountId },
    data: { passwordHash },
  });
}

export async function listActiveAccountSessions(
  prisma: PrismaExecutor,
  accountId: string,
  now: Date,
) {
  return prisma.authSession.findMany({
    where: {
      accountId,
      revokedAt: null,
      expiresAt: {
        gt: now,
      },
    },
    orderBy: [{ lastSeenAt: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function findAccountSessionById(
  prisma: PrismaExecutor,
  accountId: string,
  sessionId: string,
) {
  return prisma.authSession.findFirst({
    where: {
      id: sessionId,
      accountId,
      revokedAt: null,
    },
  });
}

export async function deleteAccountSessionById(
  prisma: PrismaExecutor,
  accountId: string,
  sessionId: string,
) {
  return prisma.authSession.deleteMany({
    where: {
      id: sessionId,
      accountId,
    },
  });
}

export async function deleteAccountSessionsExceptTokenHash(
  prisma: PrismaExecutor,
  accountId: string,
  tokenHash: string,
) {
  return prisma.authSession.deleteMany({
    where: {
      accountId,
      tokenHash: {
        not: tokenHash,
      },
    },
  });
}

export async function deleteAllAccountSessions(prisma: PrismaExecutor, accountId: string) {
  return prisma.authSession.deleteMany({
    where: { accountId },
  });
}
