import '../loadServerEnv.js';
import { AccountRole, PrismaClient } from '@prisma/client';
import { defaultCompanions } from '../appApi/defaultCompanions.js';
import { hashPassword } from '../appApi/auth/password.js';
import { getAppApiEnv } from '../appApi/env.js';
import { createInitialAccountState } from '../appApi/services/appContextService.js';

async function main() {
  const prisma = new PrismaClient();
  const env = getAppApiEnv();

  try {
    const passwordHash = await hashPassword(env.APP_DEFAULT_ACCOUNT_PASSWORD);

    await prisma.account.upsert({
      where: { id: env.APP_DEFAULT_ACCOUNT_ID },
      update: {
        name: env.APP_DEFAULT_ACCOUNT_NAME,
        username: env.APP_DEFAULT_ACCOUNT_USERNAME,
        role: AccountRole.admin,
        passwordHash,
      },
      create: {
        id: env.APP_DEFAULT_ACCOUNT_ID,
        name: env.APP_DEFAULT_ACCOUNT_NAME,
        username: env.APP_DEFAULT_ACCOUNT_USERNAME,
        role: AccountRole.admin,
        passwordHash,
      },
    });

    await createInitialAccountState(prisma, env.APP_DEFAULT_ACCOUNT_ID);

    console.log(
      `[app-api seed] ensured default account ${env.APP_DEFAULT_ACCOUNT_ID} (${env.APP_DEFAULT_ACCOUNT_NAME}) / ${env.APP_DEFAULT_ACCOUNT_USERNAME} and ${defaultCompanions.length} default companions`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error('[app-api seed] failed:', error);
  process.exitCode = 1;
});
