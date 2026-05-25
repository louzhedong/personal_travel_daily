/**
 * G1 · Wishlist Mood Board DTOs (frontend mirror) / 愿望灵感板前端 DTO 镜像
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

export interface WishlistMoodCardActionResponseDto {
  card: WishlistMoodCardDto;
  moodCardCount: number;
}

export interface DeleteWishlistMoodCardResponseDto {
  deletedId: string;
  moodCardCount: number;
}

export interface CreateWishlistMoodCardBodyDto {
  kind: WishlistMoodCardKindDto;
  imageDataUrl?: string;
  quoteText?: string;
  noteText?: string;
  seasonWindow?: string;
  budgetCents?: number;
  currency?: string;
  colorTag?: string;
  positionX?: number;
  positionY?: number;
  sortOrder?: number;
}

export interface UpdateWishlistMoodCardBodyDto {
  quoteText?: string;
  noteText?: string;
  seasonWindow?: string;
  budgetCents?: number;
  currency?: string;
  colorTag?: string;
  positionX?: number;
  positionY?: number;
  sortOrder?: number;
}
