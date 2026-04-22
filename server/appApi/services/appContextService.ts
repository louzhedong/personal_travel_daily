import type { Prisma, PrismaClient } from '@prisma/client';
import { defaultCompanions } from '../defaultCompanions.js';
import { getAppApiEnv } from '../env.js';
import { ensureAccount } from '../repositories/accountRepository.js';
import { ensureDefaultCompanions } from '../repositories/travelCompanionRepository.js';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function ensureDefaultAppState(prisma: PrismaExecutor) {
  const env = getAppApiEnv();

  await ensureAccount(prisma, {
    id: env.APP_DEFAULT_ACCOUNT_ID,
    name: env.APP_DEFAULT_ACCOUNT_NAME,
  });

  await ensureDefaultCompanions(prisma, env.APP_DEFAULT_ACCOUNT_ID, defaultCompanions);

  return {
    accountId: env.APP_DEFAULT_ACCOUNT_ID,
  };
}
