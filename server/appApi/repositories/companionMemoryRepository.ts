import type { Prisma, PrismaClient } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function findCompanionMemorySnapshot(
  prisma: PrismaExecutor,
  accountId: string,
  companionId: string,
) {
  return prisma.companionMemorySnapshot.findUnique({
    where: {
      accountId_companionId: {
        accountId,
        companionId,
      },
    },
  });
}

export async function upsertCompanionMemorySnapshot(
  prisma: PrismaExecutor,
  input: {
    id: string;
    accountId: string;
    companionId: string;
    snapshotVersion: number;
    payloadJson: Prisma.InputJsonValue;
    sourceMarkerCount: number;
    sourcePhotoCount: number;
    sourceGuideCount: number;
    generatedAt: Date;
    expiresAt: Date;
  },
) {
  return prisma.companionMemorySnapshot.upsert({
    where: {
      accountId_companionId: {
        accountId: input.accountId,
        companionId: input.companionId,
      },
    },
    create: input,
    update: {
      snapshotVersion: input.snapshotVersion,
      payloadJson: input.payloadJson,
      sourceMarkerCount: input.sourceMarkerCount,
      sourcePhotoCount: input.sourcePhotoCount,
      sourceGuideCount: input.sourceGuideCount,
      generatedAt: input.generatedAt,
      expiresAt: input.expiresAt,
    },
  });
}

export async function findCompanionMemorySource(
  prisma: PrismaExecutor,
  accountId: string,
  companionId: string,
) {
  return prisma.travelCompanion.findFirst({
    where: {
      id: companionId,
      accountId,
      isDeleted: false,
    },
    include: {
      markers: {
        where: {
          accountId,
          isDeleted: false,
        },
        orderBy: [
          { visitedStartAt: 'asc' },
          { createdAt: 'asc' },
        ],
        include: {
          trip: true,
          images: {
            orderBy: [
              { curatedSortOrder: 'asc' },
              { sortOrder: 'asc' },
            ],
          },
          savedGuides: {
            where: {
              isDeleted: false,
            },
            orderBy: {
              savedAt: 'desc',
            },
          },
        },
      },
      guides: {
        where: {
          isDeleted: false,
        },
        orderBy: {
          savedAt: 'desc',
        },
      },
    },
  });
}
