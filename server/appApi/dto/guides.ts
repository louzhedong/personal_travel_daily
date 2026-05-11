import type { Scope } from './common.js';

export interface GuideSearchResultDto {
  id: string;
  title: string;
  summary: string;
  coverImageUrl?: string;
  sourceName: string;
  sourceUrl: string;
  authorName?: string;
  publishedAt?: string;
  destinationLabel?: string;
  tags?: string[];
}

export interface GuideContentBlockDto {
  id: string;
  type: 'paragraph' | 'bullet-list' | 'section-title' | 'tips';
  text: string;
}

export interface GuideAiSummaryDto {
  highlights: string[];
  routeTips: string[];
  transportTips: string[];
  warnings: string[];
}

export interface GuideDocumentDto extends GuideSearchResultDto {
  contentHtml?: string;
  aiSummary?: GuideAiSummaryDto;
  blocks: GuideContentBlockDto[];
  fetchedAt: string;
}

export interface SavedGuideDto {
  id: string;
  markerId?: string;
  savedByUserId: string;
  keyword: string;
  result: GuideSearchResultDto | GuideDocumentDto;
  savedAt: string;
}

export interface GuideSearchHistoryItemDto {
  id: string;
  keyword: string;
  scope: Scope | 'all';
  lastResultCount?: number;
  createdAt: string;
}

export type GuideSearchLogStatusDto = 'success' | 'empty' | 'error';

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

export interface GuideSearchLogMutationResponseDto {
  item: GuideSearchLogDto;
}

export interface GuideSourceHealthListResponseDto {
  items: GuideSourceHealthDto[];
}

export interface SavedGuideListResponseDto {
  items: SavedGuideDto[];
}

export interface SavedGuideMutationResponseDto {
  item: SavedGuideDto;
  deduplicated?: boolean;
}

export interface DeleteSavedGuideResponseDto {
  deletedId: string;
}

export interface GuideSearchHistoryListResponseDto {
  items: GuideSearchHistoryItemDto[];
}

export interface GuideSearchHistoryMutationResponseDto {
  item: GuideSearchHistoryItemDto;
  deduplicated?: boolean;
}
