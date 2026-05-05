import { getPrismaClient } from '../prisma.js';
import { listActiveGuideSearchHistoriesByAccountId } from '../repositories/guideSearchHistoryRepository.js';
import { listActiveSavedGuidesByAccountId } from '../repositories/savedGuideRepository.js';
import { listActiveCompanionsByAccountId } from '../repositories/travelCompanionRepository.js';
import { listActiveTripsByAccountId } from '../repositories/tripRepository.js';
import { listActiveMarkersByAccountId } from '../repositories/visitMarkerRepository.js';
import { listActiveWishlistItemsByAccountId } from '../repositories/wishlistRepository.js';
import {
  serializeBootstrapResponse,
  serializeBootstrapStore,
} from '../serializers/bootstrapSerializer.js';
import type { AuthenticatedAccount } from '../auth/requestAuth.js';

export async function getBootstrapPayload(account: AuthenticatedAccount) {
  const prisma = getPrismaClient();

  const data = await prisma.$transaction(async (tx) => {
    const [users, trips, markers, wishlistItems, savedGuides, guideSearchHistory] = await Promise.all([
      listActiveCompanionsByAccountId(tx, account.id),
      listActiveTripsByAccountId(tx, account.id),
      listActiveMarkersByAccountId(tx, account.id),
      listActiveWishlistItemsByAccountId(tx, account.id),
      listActiveSavedGuidesByAccountId(tx, account.id),
      listActiveGuideSearchHistoriesByAccountId(tx, account.id),
    ]);

    const activeUserId = users[0]?.id ?? '';

    return {
      users,
      trips,
      markers,
      wishlistItems,
      savedGuides,
      guideSearchHistory,
      activeUserId,
    };
  });

  return serializeBootstrapResponse({
    account,
    fetchedAt: new Date(),
    store: serializeBootstrapStore(data),
  });
}
