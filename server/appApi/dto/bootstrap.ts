import type { CurrentAccountDto, TripDto, UserProfileDto, VisitMarkerDto } from './common.js';
import type { GuideSearchHistoryItemDto, SavedGuideDto } from './guides.js';
import type { WishlistItemDto } from './wishlist.js';

export interface TravelStoreDto {
  users: UserProfileDto[];
  trips: TripDto[];
  markers: VisitMarkerDto[];
  wishlistItems: WishlistItemDto[];
  activeUserId: string;
  savedGuides: SavedGuideDto[];
  guideSearchHistory: GuideSearchHistoryItemDto[];
}

export interface BootstrapResponseDto {
  store: TravelStoreDto;
  meta: {
    accountId: string;
    account: CurrentAccountDto;
    fetchedAt: string;
  };
}
