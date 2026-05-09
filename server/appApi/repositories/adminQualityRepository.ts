import type { Account, CompanionMemorySnapshot, Prisma, PrismaClient, TravelCompanion } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export type CompanionMemorySnapshotHealth = CompanionMemorySnapshot & {
  account: Pick<Account, 'id' | 'name'>;
  companion: Pick<TravelCompanion, 'id' | 'name'>;
};

export async function listCompanionMemorySnapshotHealth(
  prisma: PrismaExecutor,
): Promise<CompanionMemorySnapshotHealth[]> {
  return prisma.companionMemorySnapshot.findMany({
    orderBy: [{ expiresAt: 'asc' }, { generatedAt: 'desc' }],
    include: {
      account: {
        select: {
          id: true,
          name: true,
        },
      },
      companion: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}
