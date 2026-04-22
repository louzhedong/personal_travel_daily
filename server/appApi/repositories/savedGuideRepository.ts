import type { Prisma, PrismaClient } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function listActiveSavedGuidesByAccountId(
  prisma: PrismaExecutor,
  accountId: string,
) {
  return prisma.savedGuide.findMany({
    where: {
      accountId,
      isDeleted: false,
    },
    orderBy: {
      savedAt: 'desc',
    },
  });
}

export async function findActiveSavedGuideById(
  prisma: PrismaExecutor,
  accountId: string,
  savedGuideId: string,
) {
  return prisma.savedGuide.findFirst({
    where: {
      id: savedGuideId,
      accountId,
      isDeleted: false,
    },
  });
}

export async function findActiveSavedGuideByIdentity(
  prisma: PrismaExecutor,
  input: {
    accountId: string;
    savedByCompanionId: string;
    saveContextKey: string;
    guideIdentity: string;
  },
) {
  return prisma.savedGuide.findFirst({
    where: {
      accountId: input.accountId,
      savedByCompanionId: input.savedByCompanionId,
      saveContextKey: input.saveContextKey,
      guideIdentity: input.guideIdentity,
      isDeleted: false,
    },
  });
}

export async function createSavedGuide(
  prisma: PrismaExecutor,
  input: {
    id: string;
    accountId: string;
    savedByCompanionId: string;
    markerId?: string;
    saveContextKey: string;
    keyword: string;
    guideIdentity: string;
    guideTitle: string;
    guideSummary: string;
    guideSourceName: string;
    guideSourceUrl: string;
    guideCoverImageUrl?: string;
    guideAuthorName?: string;
    guidePublishedAt?: Date;
    guideDestinationLabel?: string;
    guidePayloadJson: Prisma.InputJsonValue;
    savedAt: Date;
  },
) {
  return prisma.savedGuide.create({
    data: {
      id: input.id,
      accountId: input.accountId,
      savedByCompanionId: input.savedByCompanionId,
      markerId: input.markerId,
      saveContextKey: input.saveContextKey,
      keyword: input.keyword,
      guideIdentity: input.guideIdentity,
      guideTitle: input.guideTitle,
      guideSummary: input.guideSummary,
      guideSourceName: input.guideSourceName,
      guideSourceUrl: input.guideSourceUrl,
      guideCoverImageUrl: input.guideCoverImageUrl,
      guideAuthorName: input.guideAuthorName,
      guidePublishedAt: input.guidePublishedAt,
      guideDestinationLabel: input.guideDestinationLabel,
      guidePayloadJson: input.guidePayloadJson,
      savedAt: input.savedAt,
    },
  });
}

export async function softDeleteSavedGuideById(
  prisma: PrismaExecutor,
  savedGuideId: string,
  deletedAt: Date,
) {
  return prisma.savedGuide.update({
    where: {
      id: savedGuideId,
    },
    data: {
      isDeleted: true,
      deletedAt,
    },
  });
}

export async function softDeleteSavedGuidesByMarkerId(
  prisma: PrismaExecutor,
  markerId: string,
  deletedAt: Date,
) {
  return prisma.savedGuide.updateMany({
    where: {
      markerId,
      isDeleted: false,
    },
    data: {
      isDeleted: true,
      deletedAt,
    },
  });
}
