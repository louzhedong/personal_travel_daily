import type {
  GuideDocument,
  GuideSearchHistoryItem,
  GuideSearchResult,
  SavedGuide,
  Scope,
  TravelStore,
} from '../../types';

export interface AppApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

export interface BootstrapResponseDto {
  store: TravelStore;
  meta: {
    accountId: string;
    fetchedAt: string;
  };
}

export interface CreateCompanionInput {
  name: string;
  color: string;
}

export interface UpdateCompanionInput {
  name?: string;
  color?: string;
}

export interface CreateMarkerInput {
  companionId: string;
  scope: Scope;
  scopeId: string;
  scopeName: string;
  city: string;
  note: string;
  imageUrls?: string[];
  visitedStartAt: string;
  visitedEndAt: string;
}

export interface UpdateMarkerInput {
  note?: string;
  imageUrls?: string[];
  visitedStartAt?: string;
  visitedEndAt?: string;
}

export interface ListSavedGuidesQuery {
  companionId?: string;
  markerId?: string;
}

export interface CreateSavedGuideInput {
  savedByUserId: string;
  markerId?: string;
  keyword: string;
  result: GuideSearchResult | GuideDocument;
}

export interface SavedGuideListResponseDto {
  items: SavedGuide[];
}

export interface SavedGuideMutationResponseDto {
  item: SavedGuide;
  deduplicated?: boolean;
}

export interface DeleteSavedGuideResponseDto {
  deletedId: string;
}

export interface ListGuideSearchHistoriesQuery {
  companionId?: string;
  limit?: number;
}

export interface CreateGuideSearchHistoryInput {
  companionId: string;
  keyword: string;
  scope: Scope | 'all';
}

export interface GuideSearchHistoryListResponseDto {
  items: GuideSearchHistoryItem[];
}

export interface GuideSearchHistoryMutationResponseDto {
  item: GuideSearchHistoryItem;
  deduplicated?: boolean;
}
