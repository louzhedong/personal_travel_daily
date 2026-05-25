/**
 * G1 · Wishlist Mood Board DTOs / 愿望灵感板 DTO
 */
export type WishlistMoodCardKindDto = 'image' | 'quote' | 'note' | 'season' | 'budget';

export interface WishlistMoodCardDto {
  id: string;
  wishlistItemId: string;
  kind: WishlistMoodCardKindDto;
  imageMediaId: string | null;
  imageUrl: string | null;
  quoteText: string | null;
  noteText: string | null;
  seasonWindow: string | null;
  budgetCents: number | null;
  currency: string | null;
  positionX: number;
  positionY: number;
  colorTag: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistMoodBoardDto {
  wishlistItemId: string;
  wishlistTitle: string;
  cards: WishlistMoodCardDto[];
}

export interface CreateWishlistMoodCardBodyDto {
  kind: WishlistMoodCardKindDto;
  quoteText?: string;
  noteText?: string;
  seasonWindow?: string;
  budgetCents?: number;
  currency?: string;
  imageDataUrl?: string;
  colorTag?: string;
  positionX?: number;
  positionY?: number;
  sortOrder?: number;
}

export interface UpdateWishlistMoodCardBodyDto {
  quoteText?: string | null;
  noteText?: string | null;
  seasonWindow?: string | null;
  budgetCents?: number | null;
  currency?: string | null;
  colorTag?: string | null;
  positionX?: number;
  positionY?: number;
  sortOrder?: number;
}

export interface WishlistMoodCardActionResponseDto {
  card: WishlistMoodCardDto;
  moodCardCount: number;
}

export interface DeleteWishlistMoodCardResponseDto {
  deletedId: string;
  moodCardCount: number;
}
