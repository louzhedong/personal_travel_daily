import { listActiveGuideSearchHistoriesByAccountId } from '../repositories/guideSearchHistoryRepository.js';
import { listActiveSavedGuidesByAccountId } from '../repositories/savedGuideRepository.js';
import { listActiveCompanionsByAccountId } from '../repositories/travelCompanionRepository.js';
import { listActiveTripsByAccountId } from '../repositories/tripRepository.js';
import { listActiveMarkersByAccountId } from '../repositories/visitMarkerRepository.js';
import { listActiveWishlistItemsByAccountId } from '../repositories/wishlistRepository.js';
import { serializeBootstrapStore } from '../serializers/bootstrapSerializer.js';
import { getPrismaClient } from '../prisma.js';

export async function buildCurrentStoreSnapshot(accountId: string) {
  const prisma = getPrismaClient();
  const [users, trips, markers, wishlistItems, savedGuides, guideSearchHistory] = await Promise.all([
    listActiveCompanionsByAccountId(prisma, accountId),
    listActiveTripsByAccountId(prisma, accountId),
    listActiveMarkersByAccountId(prisma, accountId),
    listActiveWishlistItemsByAccountId(prisma, accountId),
    listActiveSavedGuidesByAccountId(prisma, accountId),
    listActiveGuideSearchHistoriesByAccountId(prisma, accountId),
  ]);

  return serializeBootstrapStore({
    users,
    trips,
    markers,
    wishlistItems,
    activeUserId: users[0]?.id ?? '',
    savedGuides,
    guideSearchHistory,
  });
}
