import type { Prisma, PrismaClient } from '@prisma/client';
import type { DefaultCompanion } from '../defaultCompanions.js';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function ensureDefaultCompanions(
  prisma: PrismaExecutor,
  accountId: string,
  companions: DefaultCompanion[],
) {
  await Promise.all(
    companions.map((companion) =>
      prisma.travelCompanion.upsert({
        where: { id: companion.id },
        update: {
          accountId,
          name: companion.name,
          color: companion.color,
          sortOrder: companion.sortOrder,
          isDeleted: false,
          deletedAt: null,
        },
        create: {
          id: companion.id,
          accountId,
          name: companion.name,
          color: companion.color,
          sortOrder: companion.sortOrder,
        },
      }),
    ),
  );
}

export async function listActiveCompanionsByAccountId(
  prisma: PrismaExecutor,
  accountId: string,
) {
  return prisma.travelCompanion.findMany({
    where: {
      accountId,
      isDeleted: false,
    },
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'asc' },
    ],
  });
}

export async function findActiveCompanionById(
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
  });
}

export async function getNextCompanionSortOrder(
  prisma: PrismaExecutor,
  accountId: string,
) {
  const result = await prisma.travelCompanion.aggregate({
    where: {
      accountId,
      isDeleted: false,
    },
    _max: {
      sortOrder: true,
    },
  });

  return (result._max.sortOrder ?? -1) + 1;
}

export async function createCompanion(
  prisma: PrismaExecutor,
  input: {
    id: string;
    accountId: string;
    name: string;
    color: string;
    sortOrder: number;
  },
) {
  return prisma.travelCompanion.create({
    data: {
      id: input.id,
      accountId: input.accountId,
      name: input.name,
      color: input.color,
      sortOrder: input.sortOrder,
    },
  });
}

export async function updateCompanion(
  prisma: PrismaExecutor,
  companionId: string,
  input: {
    name?: string;
    color?: string;
  },
) {
  return prisma.travelCompanion.update({
    where: { id: companionId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
    },
  });
}
