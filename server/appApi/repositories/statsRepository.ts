import type { Prisma, PrismaClient } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function getStatsOverviewSource(prisma: PrismaExecutor, accountId: string) {
  return prisma.account.findFirst({
    where: {
      id: accountId,
    },
    include: {
      companions: {
        where: {
          isDeleted: false,
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
      trips: {
        where: {
          isDeleted: false,
        },
        orderBy: [{ startsAt: 'desc' }, { createdAt: 'desc' }],
      },
      markers: {
        where: {
          isDeleted: false,
        },
        include: {
          companion: true,
          images: {
            orderBy: {
              sortOrder: 'asc',
            },
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
        orderBy: [{ visitedStartAt: 'desc' }, { createdAt: 'desc' }],
      },
    },
  });
}
