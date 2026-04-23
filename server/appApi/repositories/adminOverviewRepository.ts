import type { Prisma, PrismaClient } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function listAdminOverviewAccounts(prisma: PrismaExecutor) {
  return prisma.account.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      companions: {
        where: {
          isDeleted: false,
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        include: {
          markers: {
            where: {
              isDeleted: false,
            },
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              images: {
                orderBy: {
                  sortOrder: 'asc',
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
          histories: {
            where: {
              isDeleted: false,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      },
    },
  });
}
