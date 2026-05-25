import { httpClient, getResourceBaseUrl } from './httpClient';
import type {
  CreateWishlistMoodCardBodyDto,
  DeleteWishlistMoodCardResponseDto,
  UpdateWishlistMoodCardBodyDto,
  WishlistMoodBoardDto,
  WishlistMoodCardActionResponseDto,
} from './dto/wishlistMood';

/**
 * G1 · Wishlist Mood Board API client / 愿望灵感板 API 客户端
 */
export async function fetchWishlistMoodBoard(wishlistItemId: string) {
  return httpClient.get<WishlistMoodBoardDto>(
    getResourceBaseUrl(),
    `/wishlist/${wishlistItemId}/mood`,
  );
}

export async function createWishlistMoodCard(
  wishlistItemId: string,
  body: CreateWishlistMoodCardBodyDto,
) {
  return httpClient.post<WishlistMoodCardActionResponseDto>(
    getResourceBaseUrl(),
    `/wishlist/${wishlistItemId}/mood/cards`,
    body,
  );
}

export async function updateWishlistMoodCard(
  cardId: string,
  body: UpdateWishlistMoodCardBodyDto,
) {
  return httpClient.patch<WishlistMoodCardActionResponseDto>(
    getResourceBaseUrl(),
    `/wishlist/mood/cards/${cardId}`,
    body,
  );
}

export async function deleteWishlistMoodCard(cardId: string) {
  return httpClient.delete<DeleteWishlistMoodCardResponseDto>(
    getResourceBaseUrl(),
    `/wishlist/mood/cards/${cardId}`,
  );
}

export function buildWishlistMoodCardImageUrl(cardId: string) {
  return `${getResourceBaseUrl()}/wishlist/mood/cards/${cardId}/image`;
}
