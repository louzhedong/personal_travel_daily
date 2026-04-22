import type { Prisma, PrismaClient } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function listActiveGuideSearchHistoriesByAccountId(
  prisma: PrismaExecutor,
  accountId: string,
) {
  return prisma.guideSearchHistory.findMany({
    where: {
      accountId,
      isDeleted: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function findActiveGuideSearchHistoryByIdentity(
  prisma: PrismaExecutor,
  input: {
    accountId: string;
    companionId: string;
    keywordNormalized: string;
    scope: 'domestic' | 'international' | 'all';
  },
) {
  return prisma.guideSearchHistory.findFirst({
    where: {
      accountId: input.accountId,
      companionId: input.companionId,
      keywordNormalized: input.keywordNormalized,
      scope: input.scope,
      isDeleted: false,
    },
  });
}

export async function createGuideSearchHistory(
  prisma: PrismaExecutor,
  input: {
    id: string;
    accountId: string;
    companionId: string;
    keyword: string;
    keywordNormalized: string;
    scope: 'domestic' | 'international' | 'all';
  },
) {
  return prisma.guideSearchHistory.create({
    data: {
      id: input.id,
      accountId: input.accountId,
      companionId: input.companionId,
      keyword: input.keyword,
      keywordNormalized: input.keywordNormalized,
      scope: input.scope,
    },
  });
}

export async function refreshGuideSearchHistory(
  prisma: PrismaExecutor,
  historyId: string,
  keyword: string,
) {
  return prisma.guideSearchHistory.update({
    where: {
      id: historyId,
    },
    data: {
      keyword,
      createdAt: new Date(),
    },
  });
}
