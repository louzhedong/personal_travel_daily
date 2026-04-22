import type { Prisma, PrismaClient } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function createAuthSession(
  prisma: PrismaExecutor,
  input: {
    id: string;
    accountId: string;
    tokenHash: string;
    expiresAt: Date;
  },
) {
  return prisma.authSession.create({
    data: {
      id: input.id,
      accountId: input.accountId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    },
  });
}

export async function findAuthSessionByTokenHash(
  prisma: PrismaExecutor,
  tokenHash: string,
) {
  return prisma.authSession.findUnique({
    where: { tokenHash },
    include: {
      account: true,
    },
  });
}

export async function deleteAuthSessionByTokenHash(
  prisma: PrismaExecutor,
  tokenHash: string,
) {
  return prisma.authSession.deleteMany({
    where: { tokenHash },
  });
}

export async function deleteExpiredAuthSessions(prisma: PrismaExecutor, now: Date) {
  return prisma.authSession.deleteMany({
    where: {
      expiresAt: {
        lte: now,
      },
    },
  });
}
