// bootstrap serializer - guides / 保存的攻略、搜索历史及其 mutation 响应序列化。
// bootstrap serializer - saved guides, guide search history, and their mutation responses.
import type { GuideSearchHistory, SavedGuide } from '@prisma/client';
import type {
  DeleteSavedGuideResponseDto,
  GuideContentBlockDto,
  GuideDocumentDto,
  GuideSearchHistoryItemDto,
  GuideSearchHistoryListResponseDto,
  GuideSearchHistoryMutationResponseDto,
  GuideSearchResultDto,
  SavedGuideDto,
  SavedGuideListResponseDto,
  SavedGuideMutationResponseDto,
} from '../../types.js';
import { toIsoString } from './shared.js';

function isGuideContentBlockArray(value: unknown): value is GuideContentBlockDto[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        !!item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.type === 'string' &&
        typeof item.text === 'string',
    )
  );
}

function isGuideDocumentPayload(payload: unknown): payload is GuideDocumentDto {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Partial<GuideDocumentDto>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.summary === 'string' &&
    typeof candidate.sourceName === 'string' &&
    typeof candidate.sourceUrl === 'string' &&
    typeof candidate.fetchedAt === 'string' &&
    isGuideContentBlockArray(candidate.blocks)
  );
}

function isGuideSearchResultPayload(payload: unknown): payload is GuideSearchResultDto {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Partial<GuideSearchResultDto>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.summary === 'string' &&
    typeof candidate.sourceName === 'string' &&
    typeof candidate.sourceUrl === 'string'
  );
}

function buildGuideResultFallback(savedGuide: SavedGuide): GuideSearchResultDto {
  return {
    id: savedGuide.id,
    title: savedGuide.guideTitle,
    summary: savedGuide.guideSummary,
    coverImageUrl: savedGuide.guideCoverImageUrl ?? undefined,
    sourceName: savedGuide.guideSourceName,
    sourceUrl: savedGuide.guideSourceUrl,
    authorName: savedGuide.guideAuthorName ?? undefined,
    publishedAt: savedGuide.guidePublishedAt ? toIsoString(savedGuide.guidePublishedAt) : undefined,
    destinationLabel: savedGuide.guideDestinationLabel ?? undefined,
  };
}

function serializeSavedGuideItem(savedGuide: SavedGuide): SavedGuideDto {
  const payload = savedGuide.guidePayloadJson;
  const result =
    isGuideDocumentPayload(payload) || isGuideSearchResultPayload(payload)
      ? payload
      : buildGuideResultFallback(savedGuide);

  return {
    id: savedGuide.id,
    markerId: savedGuide.markerId ?? undefined,
    savedByUserId: savedGuide.savedByCompanionId,
    keyword: savedGuide.keyword,
    result,
    savedAt: toIsoString(savedGuide.savedAt),
  };
}

export function serializeSavedGuide(savedGuide: SavedGuide): SavedGuideDto {
  return serializeSavedGuideItem(savedGuide);
}

export { serializeSavedGuideItem };

export function serializeGuideSearchHistory(history: GuideSearchHistory): GuideSearchHistoryItemDto {
  return {
    id: history.id,
    keyword: history.keyword,
    scope: history.scope,
    createdAt: toIsoString(history.createdAt),
  };
}

export function serializeSavedGuidesList(savedGuides: SavedGuide[]): SavedGuideListResponseDto {
  return {
    items: savedGuides.map(serializeSavedGuideItem),
  };
}

export function serializeSavedGuideMutation(
  savedGuide: SavedGuide,
  deduplicated = false,
): SavedGuideMutationResponseDto {
  return {
    item: serializeSavedGuideItem(savedGuide),
    ...(deduplicated ? { deduplicated: true } : {}),
  };
}

export function serializeDeleteSavedGuide(savedGuideId: string): DeleteSavedGuideResponseDto {
  return {
    deletedId: savedGuideId,
  };
}

export function serializeGuideSearchHistoryList(
  histories: GuideSearchHistory[],
): GuideSearchHistoryListResponseDto {
  return {
    items: histories.map(serializeGuideSearchHistory),
  };
}

export function serializeGuideSearchHistoryMutation(
  history: GuideSearchHistory,
  deduplicated = false,
): GuideSearchHistoryMutationResponseDto {
  return {
    item: serializeGuideSearchHistory(history),
    ...(deduplicated ? { deduplicated: true } : {}),
  };
}
