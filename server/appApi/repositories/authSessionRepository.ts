import type { Prisma, PrismaClient } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function createAuthSession(
  prisma: PrismaExecutor,
  input: {
    id: string;
    accountId: string;
    tokenHash: string;
    userAgent?: string | null;
    ipAddress?: string | null;
    lastSeenAt?: Date;
    expiresAt: Date;
  },
) {
  return prisma.authSession.create({
    data: {
      id: input.id,
      accountId: input.accountId,
      tokenHash: input.tokenHash,
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
      lastSeenAt: input.lastSeenAt ?? new Date(),
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

export async function findActiveAuthSessionByTokenHash(
  prisma: PrismaExecutor,
  tokenHash: string,
) {
  return prisma.authSession.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
    },
    include: {
      account: true,
    },
  });
}

export async function updateAuthSessionLastSeen(
  prisma: PrismaExecutor,
  sessionId: string,
  now: Date,
) {
  return prisma.authSession.updateMany({
    where: {
      id: sessionId,
      revokedAt: null,
    },
    data: {
      lastSeenAt: now,
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
