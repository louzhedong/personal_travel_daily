import type { Prisma, PrismaClient, ReminderPreference, ReminderState } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export type ReminderSourceAccount = Awaited<ReturnType<typeof getReminderSourceAccount>>;

export function getReminderSourceAccount(prisma: PrismaExecutor, accountId: string) {
  return prisma.account.findUnique({
    where: { id: accountId },
    include: {
      trips: {
        where: { isDeleted: false },
        include: {
          markers: {
            where: { isDeleted: false },
            include: { images: { orderBy: { sortOrder: 'asc' } } },
          },
          planningItems: {
            where: { isDeleted: false },
            include: { createdByCompanion: { select: { id: true, name: true, color: true } } },
          },
        },
      },
      companions: {
        where: { isDeleted: false },
        include: {
          memorySnapshots: true,
        },
      },
      sessions: {
        where: {
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: [{ lastSeenAt: 'desc' }],
      },
    },
  });
}

export function listReminderPreferences(prisma: PrismaExecutor, accountId: string): Promise<ReminderPreference[]> {
  return prisma.reminderPreference.findMany({
    where: { accountId },
    orderBy: [{ type: 'asc' }],
  });
}

export function listReminderStates(prisma: PrismaExecutor, accountId: string): Promise<ReminderState[]> {
  return prisma.reminderState.findMany({
    where: { accountId },
  });
}

export function upsertReminderState(
  prisma: PrismaExecutor,
  input: {
    id: string;
    accountId: string;
    fingerprint: string;
    status?: string;
    resolvedAt?: Date | null;
    mutedUntil?: Date | null;
    lastSeenAt: Date;
  },
) {
  return prisma.reminderState.upsert({
    where: {
      accountId_fingerprint: {
        accountId: input.accountId,
        fingerprint: input.fingerprint,
      },
    },
    create: {
      id: input.id,
      accountId: input.accountId,
      fingerprint: input.fingerprint,
      status: input.status ?? 'open',
      resolvedAt: input.resolvedAt,
      mutedUntil: input.mutedUntil,
      lastSeenAt: input.lastSeenAt,
    },
    update: {
      lastSeenAt: input.lastSeenAt,
    },
  });
}

export function resolveReminderState(
  prisma: PrismaExecutor,
  input: { id: string; accountId: string; fingerprint: string; resolvedAt: Date },
) {
  return prisma.reminderState.upsert({
    where: {
      accountId_fingerprint: {
        accountId: input.accountId,
        fingerprint: input.fingerprint,
      },
    },
    create: {
      id: input.id,
      accountId: input.accountId,
      fingerprint: input.fingerprint,
      status: 'resolved',
      resolvedAt: input.resolvedAt,
      lastSeenAt: input.resolvedAt,
    },
    update: {
      status: 'resolved',
      resolvedAt: input.resolvedAt,
      lastSeenAt: input.resolvedAt,
    },
  });
}

export function upsertReminderPreference(
  prisma: PrismaExecutor,
  input: { id: string; accountId: string; type: string; enabled: boolean; mutedUntil?: Date | null },
) {
  return prisma.reminderPreference.upsert({
    where: {
      accountId_type: {
        accountId: input.accountId,
        type: input.type,
      },
    },
    create: input,
    update: {
      enabled: input.enabled,
      mutedUntil: input.mutedUntil,
    },
  });
}

export function listRecentGuideSearchStatus(prisma: PrismaExecutor, createdAtGte: Date) {
  return prisma.guideSearchLog.groupBy({
    by: ['status'],
    where: {
      createdAt: { gte: createdAtGte },
    },
    _count: {
      _all: true,
    },
  });
}

export function listGuideSourceHealthForReminders(prisma: PrismaExecutor) {
  return prisma.guideSourceHealth.findMany({
    orderBy: [{ updatedAt: 'desc' }],
    take: 20,
  });
}
