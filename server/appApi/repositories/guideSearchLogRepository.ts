import type { Prisma, PrismaClient } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function createGuideSearchLog(
  prisma: PrismaExecutor,
  input: {
    id: string;
    accountId: string;
    companionId: string;
    keyword: string;
    keywordNormalized: string;
    scope: 'domestic' | 'international' | 'all';
    provider: string;
    page: number;
    pageSize: number;
    resultCount: number;
    hasMore: boolean;
    durationMs: number;
    status: 'success' | 'empty' | 'error';
    errorCode?: string;
    sourceName?: string;
    sourceDomain?: string;
  },
) {
  return prisma.guideSearchLog.create({
    data: {
      id: input.id,
      accountId: input.accountId,
      companionId: input.companionId,
      keyword: input.keyword,
      keywordNormalized: input.keywordNormalized,
      scope: input.scope,
      provider: input.provider,
      page: input.page,
      pageSize: input.pageSize,
      resultCount: input.resultCount,
      hasMore: input.hasMore,
      durationMs: input.durationMs,
      status: input.status,
      errorCode: input.errorCode,
      sourceName: input.sourceName,
      sourceDomain: input.sourceDomain,
    },
  });
}

export async function listRecentGuideSearchLogs(
  prisma: PrismaExecutor,
  options: {
    createdAtGte: Date;
    limit?: number;
  },
) {
  return prisma.guideSearchLog.findMany({
    where: {
      createdAt: {
        gte: options.createdAtGte,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: options.limit,
  });
}

export async function aggregateGuideSearchStatusBreakdown(
  prisma: PrismaExecutor,
  createdAtGte: Date,
) {
  return prisma.guideSearchLog.groupBy({
    by: ['status'],
    where: {
      createdAt: {
        gte: createdAtGte,
      },
    },
    _count: {
      _all: true,
    },
  });
}
