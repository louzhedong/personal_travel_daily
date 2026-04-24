import type { Prisma, PrismaClient } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function findTripDetailSource(
  prisma: PrismaExecutor,
  accountId: string,
  tripId: string,
) {
  return prisma.trip.findFirst({
    where: {
      id: tripId,
      accountId,
      isDeleted: false,
    },
    include: {
      markers: {
        where: {
          isDeleted: false,
        },
        orderBy: [
          {
            visitedStartAt: 'asc',
          },
          {
            createdAt: 'asc',
          },
        ],
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
      },
    },
  });
}
