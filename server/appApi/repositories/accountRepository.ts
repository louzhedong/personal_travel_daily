import type { Prisma, PrismaClient } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export interface EnsureAccountInput {
  id: string;
  name: string;
}

export async function ensureAccount(
  prisma: PrismaExecutor,
  input: EnsureAccountInput,
) {
  return prisma.account.upsert({
    where: { id: input.id },
    update: {
      name: input.name,
    },
    create: {
      id: input.id,
      name: input.name,
    },
  });
}

export async function findAccountById(
  prisma: PrismaExecutor,
  accountId: string,
) {
  return prisma.account.findUnique({
    where: { id: accountId },
  });
}
