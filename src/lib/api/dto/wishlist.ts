import type { Scope, TravelStore, WishlistItem, WishlistPriority } from '../../../types';
import type { GuideSourceInput } from './guides';

export interface CreateWishlistItemInput {
  companionId: string;
  title: string;
  scope: Scope;
  scopeId: string;
  scopeName: string;
  city: string;
  note?: string;
  priority?: WishlistPriority;
  targetYear?: string | null;
  guide?: GuideSourceInput;
}

export interface UpdateWishlistItemInput {
  title?: string;
  scope?: Scope;
  scopeId?: string;
  scopeName?: string;
  city?: string;
  note?: string | null;
  priority?: WishlistPriority;
  targetYear?: string | null;
}

export interface ConvertWishlistToTripInput {
  name?: string;
  note?: string;
  startsAt?: string;
  endsAt?: string;
}

export interface WishlistListResponseDto {
  items: WishlistItem[];
}

export interface ConvertWishlistToTripResponseDto {
  tripId: string;
  store: TravelStore;
}

export interface DeleteWishlistItemResponseDto {
  deletedId: string;
}
