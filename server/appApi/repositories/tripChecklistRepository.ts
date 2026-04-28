import type { Prisma, PrismaClient, TripChecklistStage } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function listActiveTripChecklistItemsByTripId(
  prisma: PrismaExecutor,
  accountId: string,
  tripId: string,
) {
  return prisma.tripChecklistItem.findMany({
    where: {
      accountId,
      tripId,
      isDeleted: false,
    },
    orderBy: [
      { stage: 'asc' },
      { sortOrder: 'asc' },
      { createdAt: 'asc' },
    ],
    include: {
      createdByCompanion: true,
    },
  });
}

export async function findActiveTripChecklistItemById(
  prisma: PrismaExecutor,
  accountId: string,
  tripId: string,
  itemId: string,
) {
  return prisma.tripChecklistItem.findFirst({
    where: {
      id: itemId,
      accountId,
      tripId,
      isDeleted: false,
    },
    include: {
      createdByCompanion: true,
    },
  });
}

export async function getNextTripChecklistSortOrder(
  prisma: PrismaExecutor,
  accountId: string,
  tripId: string,
  stage: TripChecklistStage,
) {
  const result = await prisma.tripChecklistItem.aggregate({
    where: {
      accountId,
      tripId,
      stage,
      isDeleted: false,
    },
    _max: {
      sortOrder: true,
    },
  });

  return (result._max.sortOrder ?? -1) + 1;
}

export async function createTripChecklistItem(
  prisma: PrismaExecutor,
  input: {
    id: string;
    accountId: string;
    tripId: string;
    createdByCompanionId: string;
    title: string;
    note?: string;
    stage: TripChecklistStage;
    sortOrder: number;
    origin: 'generated' | 'manual';
    sourceGuideIdentity?: string;
    sourceGuideTitle?: string;
    sourceGuideSourceName?: string;
    sourceGuideSourceUrl?: string;
    sourceSnippet?: string;
  },
) {
  return prisma.tripChecklistItem.create({
    data: {
      id: input.id,
      accountId: input.accountId,
      tripId: input.tripId,
      createdByCompanionId: input.createdByCompanionId,
      title: input.title,
      note: input.note,
      stage: input.stage,
      sortOrder: input.sortOrder,
      origin: input.origin,
      sourceGuideIdentity: input.sourceGuideIdentity,
      sourceGuideTitle: input.sourceGuideTitle,
      sourceGuideSourceName: input.sourceGuideSourceName,
      sourceGuideSourceUrl: input.sourceGuideSourceUrl,
      sourceSnippet: input.sourceSnippet,
    },
    include: {
      createdByCompanion: true,
    },
  });
}

export async function updateTripChecklistItem(
  prisma: PrismaExecutor,
  itemId: string,
  input: {
    title?: string;
    note?: string | null;
    stage?: TripChecklistStage;
    sortOrder?: number;
  },
) {
  return prisma.tripChecklistItem.update({
    where: {
      id: itemId,
    },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.stage !== undefined ? { stage: input.stage } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
    include: {
      createdByCompanion: true,
    },
  });
}

export async function softDeleteTripChecklistItem(
  prisma: PrismaExecutor,
  itemId: string,
  deletedAt: Date,
) {
  return prisma.tripChecklistItem.update({
    where: {
      id: itemId,
    },
    data: {
      isDeleted: true,
      deletedAt,
    },
  });
}
