import type { Prisma, PrismaClient } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export interface EnsureAccountInput {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
}

export async function ensureAccount(
  prisma: PrismaExecutor,
  input: EnsureAccountInput,
) {
  return prisma.account.upsert({
    where: { id: input.id },
    update: {
      name: input.name,
      username: input.username,
      passwordHash: input.passwordHash,
    },
    create: {
      id: input.id,
      name: input.name,
      username: input.username,
      passwordHash: input.passwordHash,
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

export async function findAccountByUsername(
  prisma: PrismaExecutor,
  username: string,
) {
  return prisma.account.findUnique({
    where: { username },
  });
}

export async function createAccount(
  prisma: PrismaExecutor,
  input: EnsureAccountInput,
) {
  return prisma.account.create({
    data: {
      id: input.id,
      name: input.name,
      username: input.username,
      passwordHash: input.passwordHash,
    },
  });
}
