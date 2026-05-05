import { httpClient, getResourceBaseUrl } from './httpClient';
import type {
  CreateWishlistItemInput,
  ConvertWishlistToTripInput,
  ConvertWishlistToTripResponseDto,
  DeleteWishlistItemResponseDto,
  UpdateWishlistItemInput,
  WishlistListResponseDto,
} from './types';
import type { WishlistItem } from '../../types';

export async function fetchWishlistItems() {
  return httpClient.get<WishlistListResponseDto>(getResourceBaseUrl(), '/wishlist');
}

export async function createWishlistItem(input: CreateWishlistItemInput) {
  return httpClient.post<WishlistItem>(getResourceBaseUrl(), '/wishlist', input);
}

export async function updateWishlistItem(id: string, input: UpdateWishlistItemInput) {
  return httpClient.patch<WishlistItem>(getResourceBaseUrl(), `/wishlist/${id}`, input);
}

export async function convertWishlistToTrip(id: string, input: ConvertWishlistToTripInput = {}) {
  return httpClient.post<ConvertWishlistToTripResponseDto>(getResourceBaseUrl(), `/wishlist/${id}/convert-to-trip`, input);
}

export async function deleteWishlistItem(id: string) {
  return httpClient.delete<DeleteWishlistItemResponseDto>(getResourceBaseUrl(), `/wishlist/${id}`);
}
