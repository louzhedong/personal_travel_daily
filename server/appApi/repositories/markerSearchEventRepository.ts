import type { Prisma, PrismaClient } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function createMarkerSearchEvent(
  prisma: PrismaExecutor,
  input: {
    id: string;
    accountId: string;
    companionId?: string;
    keyword: string;
    scope: 'domestic' | 'international' | 'all';
    year?: string;
    resultCount: number;
    page: number;
    pageSize: number;
  },
) {
  return prisma.markerSearchEvent.create({
    data: {
      id: input.id,
      accountId: input.accountId,
      companionId: input.companionId,
      keyword: input.keyword,
      scope: input.scope,
      year: input.year,
      resultCount: input.resultCount,
      page: input.page,
      pageSize: input.pageSize,
    },
  });
}
