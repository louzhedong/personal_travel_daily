import { listActiveGuideSearchHistoriesByAccountId } from '../repositories/guideSearchHistoryRepository.js';
import { listActiveSavedGuidesByAccountId } from '../repositories/savedGuideRepository.js';
import { listActiveCompanionsByAccountId } from '../repositories/travelCompanionRepository.js';
import { listActiveMarkersByAccountId } from '../repositories/visitMarkerRepository.js';
import { serializeBootstrapStore } from '../serializers/bootstrapSerializer.js';
import { getPrismaClient } from '../prisma.js';

export async function buildCurrentStoreSnapshot(accountId: string) {
  const prisma = getPrismaClient();
  const [users, markers, savedGuides, guideSearchHistory] = await Promise.all([
    listActiveCompanionsByAccountId(prisma, accountId),
    listActiveMarkersByAccountId(prisma, accountId),
    listActiveSavedGuidesByAccountId(prisma, accountId),
    listActiveGuideSearchHistoriesByAccountId(prisma, accountId),
  ]);

  return serializeBootstrapStore({
    users,
    markers,
    activeUserId: users[0]?.id ?? '',
    savedGuides,
    guideSearchHistory,
  });
}
