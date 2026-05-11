import type {
  GuideDocument,
  GuideSearchHistoryItem,
  GuideSearchResult,
  SavedGuide,
  Scope,
} from '../../../types';

export interface GuideSourceInput {
  identity?: string;
  title?: string;
  sourceName?: string;
  sourceUrl?: string;
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
  lastResultCount?: number;
}

export interface GuideSearchHistoryListResponseDto {
  items: GuideSearchHistoryItem[];
}

export interface GuideSearchHistoryMutationResponseDto {
  item: GuideSearchHistoryItem;
  deduplicated?: boolean;
}

export type GuideSearchLogStatusDto = 'success' | 'empty' | 'error';

export interface CreateGuideSearchLogInput {
  companionId: string;
  keyword: string;
  scope: Scope | 'all';
  provider: string;
  page: number;
  pageSize: number;
  resultCount: number;
  hasMore: boolean;
  durationMs: number;
  status: GuideSearchLogStatusDto;
  errorCode?: string;
  sourceName?: string;
  sourceDomain?: string;
}

export interface GuideSearchLogDto {
  id: string;
  companionId: string;
  keyword: string;
  scope: Scope | 'all';
  provider: string;
  page: number;
  pageSize: number;
  resultCount: number;
  hasMore: boolean;
  durationMs: number;
  status: GuideSearchLogStatusDto;
  errorCode?: string;
  sourceName?: string;
  sourceDomain?: string;
  createdAt: string;
}

export interface GuideSearchLogMutationResponseDto {
  item: GuideSearchLogDto;
}

export interface GuideSourceHealthListResponseDto {
  items: GuideSourceHealthDto[];
}

export interface GuideSearchTrendPointDto {
  date: string;
  totalCount: number;
  successCount: number;
  emptyCount: number;
  errorCount: number;
  topKeywords: Array<{
    keyword: string;
    count: number;
  }>;
}

export interface GuideSearchStatusBreakdownDto {
  status: GuideSearchLogStatusDto;
  count: number;
}

export interface GuideSourceHealthDto {
  id: string;
  sourceName: string;
  sourceDomain: string;
  recentSuccess: number;
  recentFailure: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  lastFailureReason?: string;
}
