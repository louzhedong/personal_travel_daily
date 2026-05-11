import type { Scope } from './common.js';

export type WishlistPriorityDto = 'low' | 'medium' | 'high';

export interface WishlistItemDto {
  id: string;
  companionId: string;
  companionName: string;
  companionColor: string;
  title: string;
  scope: Scope;
  scopeId: string;
  scopeName: string;
  city: string;
  note?: string;
  priority: WishlistPriorityDto;
  targetYear?: string;
  sourceGuideIdentity?: string;
  sourceGuideTitle?: string;
  sourceGuideSourceName?: string;
  sourceGuideSourceUrl?: string;
  importedTrips: Array<{
    id: string;
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistListResponseDto {
  items: WishlistItemDto[];
}

export interface DeleteWishlistItemResponseDto {
  deletedId: string;
}
