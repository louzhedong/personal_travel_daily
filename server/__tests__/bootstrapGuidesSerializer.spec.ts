// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  serializeDeleteSavedGuide,
  serializeGuideSearchHistory,
  serializeGuideSearchHistoryList,
  serializeGuideSearchHistoryMutation,
  serializeSavedGuide,
  serializeSavedGuideMutation,
  serializeSavedGuidesList,
} from '../appApi/serializers/bootstrap/guides.js';

describe('bootstrap guides serializer', () => {
  it('serializes saved guides with document/search payloads and fallback metadata', () => {
    const searchPayloadGuide = {
      id: 'saved-1',
      markerId: 'marker-1',
      savedByCompanionId: 'user-1',
      keyword: '京都',
      guideTitle: '不会走到这里',
      guideSummary: '不会走到这里',
      guideSourceName: 'Qyer',
      guideSourceUrl: 'https://example.com/search',
      guideCoverImageUrl: null,
      guideAuthorName: null,
      guidePublishedAt: null,
      guideDestinationLabel: null,
      guidePayloadJson: {
        id: 'guide-1',
        title: '京都散步',
        summary: '慢慢走',
        sourceName: 'Qyer',
        sourceUrl: 'https://example.com/search',
      },
      savedAt: new Date('2026-04-01T00:00:00.000Z'),
    } as never;

    const fallbackGuide = {
      id: 'saved-2',
      markerId: null,
      savedByCompanionId: 'user-2',
      keyword: '杭州',
      guideTitle: '杭州周末攻略',
      guideSummary: '西湖和灵隐寺',
      guideSourceName: 'Example',
      guideSourceUrl: 'https://example.com/fallback',
      guideCoverImageUrl: 'https://example.com/cover.jpg',
      guideAuthorName: '作者甲',
      guidePublishedAt: new Date('2026-04-02T00:00:00.000Z'),
      guideDestinationLabel: '杭州',
      guidePayloadJson: { invalid: true },
      savedAt: new Date('2026-04-03T00:00:00.000Z'),
    } as never;

    expect(serializeSavedGuide(searchPayloadGuide)).toEqual({
      id: 'saved-1',
      markerId: 'marker-1',
      savedByUserId: 'user-1',
      keyword: '京都',
      result: {
        id: 'guide-1',
        title: '京都散步',
        summary: '慢慢走',
        sourceName: 'Qyer',
        sourceUrl: 'https://example.com/search',
      },
      savedAt: '2026-04-01T00:00:00.000Z',
    });

    expect(serializeSavedGuide(fallbackGuide)).toEqual({
      id: 'saved-2',
      savedByUserId: 'user-2',
      keyword: '杭州',
      result: {
        id: 'saved-2',
        title: '杭州周末攻略',
        summary: '西湖和灵隐寺',
        coverImageUrl: 'https://example.com/cover.jpg',
        sourceName: 'Example',
        sourceUrl: 'https://example.com/fallback',
        authorName: '作者甲',
        publishedAt: '2026-04-02T00:00:00.000Z',
        destinationLabel: '杭州',
      },
      savedAt: '2026-04-03T00:00:00.000Z',
    });
  });

  it('serializes list and mutation responses with optional deduplicated flags', () => {
    const savedGuide = {
      id: 'saved-1',
      markerId: null,
      savedByCompanionId: 'user-1',
      keyword: '京都',
      guideTitle: '京都散步',
      guideSummary: '慢慢走',
      guideSourceName: 'Qyer',
      guideSourceUrl: 'https://example.com/search',
      guideCoverImageUrl: null,
      guideAuthorName: null,
      guidePublishedAt: null,
      guideDestinationLabel: null,
      guidePayloadJson: {
        id: 'guide-1',
        title: '京都散步',
        summary: '慢慢走',
        sourceName: 'Qyer',
        sourceUrl: 'https://example.com/search',
      },
      savedAt: new Date('2026-04-01T00:00:00.000Z'),
    } as never;

    expect(serializeSavedGuidesList([savedGuide])).toEqual({
      items: [serializeSavedGuide(savedGuide)],
    });
    expect(serializeSavedGuideMutation(savedGuide)).toEqual({
      item: serializeSavedGuide(savedGuide),
    });
    expect(serializeSavedGuideMutation(savedGuide, true)).toEqual({
      item: serializeSavedGuide(savedGuide),
      deduplicated: true,
    });
    expect(serializeDeleteSavedGuide('saved-1')).toEqual({
      deletedId: 'saved-1',
    });
  });

  it('serializes guide search history records and mutations', () => {
    const history = {
      id: 'history-1',
      keyword: '京都',
      scope: 'international',
      createdAt: new Date('2026-04-01T00:00:00.000Z'),
    } as never;

    expect(serializeGuideSearchHistory(history)).toEqual({
      id: 'history-1',
      keyword: '京都',
      scope: 'international',
      createdAt: '2026-04-01T00:00:00.000Z',
    });
    expect(serializeGuideSearchHistoryList([history])).toEqual({
      items: [serializeGuideSearchHistory(history)],
    });
    expect(serializeGuideSearchHistoryMutation(history)).toEqual({
      item: serializeGuideSearchHistory(history),
    });
    expect(serializeGuideSearchHistoryMutation(history, true)).toEqual({
      item: serializeGuideSearchHistory(history),
      deduplicated: true,
    });
  });
});
