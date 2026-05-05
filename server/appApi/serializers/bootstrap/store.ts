// bootstrap serializer - store 聚合 / TravelStore + BootstrapResponse 顶层组装。
// bootstrap serializer - top-level TravelStore + BootstrapResponse composition.
import type { GuideSearchHistory, SavedGuide, TravelCompanion, Trip } from '@prisma/client';
import type {
  BootstrapResponseDto,
  CurrentAccountDto,
  TravelStoreDto,
} from '../../types.js';
import { serializeCompanion } from './companions.js';
import { serializeGuideSearchHistory, serializeSavedGuideItem } from './guides.js';
import { serializeMarker, type MarkerWithImages } from './markers.js';
import { serializeTrip } from './trips.js';
import { serializeWishlistItem, type WishlistItemWithRelations } from './wishlist.js';
import { toIsoString } from './shared.js';

export function serializeBootstrapStore(input: {
  users: TravelCompanion[];
  trips: Trip[];
  markers: MarkerWithImages[];
  wishlistItems: WishlistItemWithRelations[];
  activeUserId: string;
  savedGuides: SavedGuide[];
  guideSearchHistory: GuideSearchHistory[];
}): TravelStoreDto {
  return {
    users: input.users.map(serializeCompanion),
    trips: input.trips.map(serializeTrip),
    markers: input.markers.map(serializeMarker),
    wishlistItems: input.wishlistItems.map(serializeWishlistItem),
    activeUserId: input.activeUserId,
    savedGuides: input.savedGuides.map(serializeSavedGuideItem),
    guideSearchHistory: input.guideSearchHistory.map(serializeGuideSearchHistory),
  };
}

export function serializeBootstrapResponse(input: {
  account: CurrentAccountDto;
  fetchedAt: Date;
  store: TravelStoreDto;
}): BootstrapResponseDto {
  return {
    store: input.store,
    meta: {
      accountId: input.account.id,
      account: input.account,
      fetchedAt: toIsoString(input.fetchedAt),
    },
  };
}
