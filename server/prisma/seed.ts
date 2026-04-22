import '../loadServerEnv.js';
import { PrismaClient } from '@prisma/client';
import { defaultCompanions } from '../appApi/defaultCompanions.js';
import { getAppApiEnv } from '../appApi/env.js';

async function main() {
  const prisma = new PrismaClient();
  const env = getAppApiEnv();

  try {
    await prisma.account.upsert({
      where: { id: env.APP_DEFAULT_ACCOUNT_ID },
      update: {
        name: env.APP_DEFAULT_ACCOUNT_NAME,
      },
      create: {
        id: env.APP_DEFAULT_ACCOUNT_ID,
        name: env.APP_DEFAULT_ACCOUNT_NAME,
      },
    });

    await Promise.all(
      defaultCompanions.map((companion) =>
        prisma.travelCompanion.upsert({
          where: { id: companion.id },
          update: {
            accountId: env.APP_DEFAULT_ACCOUNT_ID,
            name: companion.name,
            color: companion.color,
            sortOrder: companion.sortOrder,
            isDeleted: false,
            deletedAt: null,
          },
          create: {
            id: companion.id,
            accountId: env.APP_DEFAULT_ACCOUNT_ID,
            name: companion.name,
            color: companion.color,
            sortOrder: companion.sortOrder,
          },
        }),
      ),
    );

    console.log(
      `[app-api seed] ensured default account ${env.APP_DEFAULT_ACCOUNT_ID} (${env.APP_DEFAULT_ACCOUNT_NAME}) and ${defaultCompanions.length} default companions`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error('[app-api seed] failed:', error);
  process.exitCode = 1;
});
