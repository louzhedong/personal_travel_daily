import type { Prisma, PrismaClient } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function upsertGuideSourceHealth(
  prisma: PrismaExecutor,
  input: {
    id: string;
    sourceName: string;
    sourceDomain: string;
    wasSuccessful: boolean;
    failureReason?: string;
    occurredAt: Date;
  },
) {
  return prisma.guideSourceHealth.upsert({
    where: {
      sourceName_sourceDomain: {
        sourceName: input.sourceName,
        sourceDomain: input.sourceDomain,
      },
    },
    create: {
      id: input.id,
      sourceName: input.sourceName,
      sourceDomain: input.sourceDomain,
      recentSuccess: input.wasSuccessful ? 1 : 0,
      recentFailure: input.wasSuccessful ? 0 : 1,
      lastSuccessAt: input.wasSuccessful ? input.occurredAt : undefined,
      lastFailureAt: input.wasSuccessful ? undefined : input.occurredAt,
      lastFailureReason: input.wasSuccessful ? undefined : input.failureReason,
    },
    update: {
      recentSuccess: {
        increment: input.wasSuccessful ? 1 : 0,
      },
      recentFailure: {
        increment: input.wasSuccessful ? 0 : 1,
      },
      lastSuccessAt: input.wasSuccessful ? input.occurredAt : undefined,
      lastFailureAt: input.wasSuccessful ? undefined : input.occurredAt,
      lastFailureReason: input.wasSuccessful ? undefined : input.failureReason,
    },
  });
}

export async function listGuideSourceHealthSnapshot(prisma: PrismaExecutor, limit = 20) {
  return prisma.guideSourceHealth.findMany({
    orderBy: [{ recentFailure: 'desc' }, { updatedAt: 'desc' }],
    take: limit,
  });
}

export async function listGuideSourcePreferences(prisma: PrismaExecutor) {
  return prisma.guideSourcePreference.findMany({
    orderBy: [{ priorityWeight: 'asc' }, { updatedAt: 'desc' }],
  });
}

export async function findGuideSourcePreference(
  prisma: PrismaExecutor,
  input: {
    sourceName: string;
    sourceDomain: string;
  },
) {
  return prisma.guideSourcePreference.findUnique({
    where: {
      sourceName_sourceDomain: {
        sourceName: input.sourceName,
        sourceDomain: input.sourceDomain,
      },
    },
  });
}

export async function upsertGuideSourcePreference(
  prisma: PrismaExecutor,
  input: {
    id: string;
    sourceName: string;
    sourceDomain: string;
    priorityWeight: number;
    demotionReason?: string;
    updatedBy?: string;
  },
) {
  return prisma.guideSourcePreference.upsert({
    where: {
      sourceName_sourceDomain: {
        sourceName: input.sourceName,
        sourceDomain: input.sourceDomain,
      },
    },
    create: {
      id: input.id,
      sourceName: input.sourceName,
      sourceDomain: input.sourceDomain,
      priorityWeight: input.priorityWeight,
      demotionReason: input.demotionReason,
      updatedBy: input.updatedBy,
    },
    update: {
      priorityWeight: input.priorityWeight,
      demotionReason: input.demotionReason,
      updatedBy: input.updatedBy,
    },
  });
}

export async function listLatestGuideQualitySnapshotsByDomain(
  prisma: PrismaExecutor,
  sourceDomains: string[],
) {
  if (sourceDomains.length === 0) {
    return [];
  }

  return prisma.guideQualitySnapshot.findMany({
    where: {
      sourceDomain: {
        in: sourceDomains,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: sourceDomains.length * 3,
  });
}
