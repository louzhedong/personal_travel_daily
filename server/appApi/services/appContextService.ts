import type { Prisma, PrismaClient } from '@prisma/client';
import { defaultCompanions } from '../defaultCompanions.js';
import { getAppApiEnv } from '../env.js';
import { hashPassword } from '../auth/password.js';
import { ensureAccount } from '../repositories/accountRepository.js';
import { ensureDefaultCompanions } from '../repositories/travelCompanionRepository.js';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function createInitialAccountState(prisma: PrismaExecutor, accountId: string) {
  await ensureDefaultCompanions(prisma, accountId, defaultCompanions);
}

export async function ensureDefaultAppState(prisma: PrismaExecutor) {
  const env = getAppApiEnv();
  const passwordHash = await hashPassword(env.APP_DEFAULT_ACCOUNT_PASSWORD);

  await ensureAccount(prisma, {
    id: env.APP_DEFAULT_ACCOUNT_ID,
    name: env.APP_DEFAULT_ACCOUNT_NAME,
    username: env.APP_DEFAULT_ACCOUNT_USERNAME,
    passwordHash,
  });

  await createInitialAccountState(prisma, env.APP_DEFAULT_ACCOUNT_ID);

  return {
    accountId: env.APP_DEFAULT_ACCOUNT_ID,
  };
}
