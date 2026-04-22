import { defaultCompanions } from '../defaultCompanions.js';
import { getAppApiEnv } from '../env.js';
import { getPrismaClient } from '../prisma.js';
import { listActiveGuideSearchHistoriesByAccountId } from '../repositories/guideSearchHistoryRepository.js';
import { listActiveSavedGuidesByAccountId } from '../repositories/savedGuideRepository.js';
import { listActiveCompanionsByAccountId } from '../repositories/travelCompanionRepository.js';
import { listActiveMarkersByAccountId } from '../repositories/visitMarkerRepository.js';
import {
  serializeBootstrapResponse,
  serializeBootstrapStore,
} from '../serializers/bootstrapSerializer.js';
import { ensureDefaultAppState } from './appContextService.js';

export async function getBootstrapPayload() {
  const env = getAppApiEnv();
  const prisma = getPrismaClient();

  const data = await prisma.$transaction(async (tx) => {
    await ensureDefaultAppState(tx);

    const [users, markers, savedGuides, guideSearchHistory] = await Promise.all([
      listActiveCompanionsByAccountId(tx, env.APP_DEFAULT_ACCOUNT_ID),
      listActiveMarkersByAccountId(tx, env.APP_DEFAULT_ACCOUNT_ID),
      listActiveSavedGuidesByAccountId(tx, env.APP_DEFAULT_ACCOUNT_ID),
      listActiveGuideSearchHistoriesByAccountId(tx, env.APP_DEFAULT_ACCOUNT_ID),
    ]);

    const activeUserId = users[0]?.id ?? defaultCompanions[0].id;

    return {
      users,
      markers,
      savedGuides,
      guideSearchHistory,
      activeUserId,
    };
  });

  return serializeBootstrapResponse({
    accountId: env.APP_DEFAULT_ACCOUNT_ID,
    fetchedAt: new Date(),
    store: serializeBootstrapStore(data),
  });
}
