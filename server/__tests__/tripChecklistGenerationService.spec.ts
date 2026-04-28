// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getGuideDocumentBySourceUrlMock: vi.fn(),
}));

vi.mock('../appApi/services/guideDocumentService.js', () => ({
  getGuideDocumentBySourceUrl: mocks.getGuideDocumentBySourceUrlMock,
}));

import { buildGeneratedTripChecklistDrafts } from '../appApi/services/tripChecklistGenerationService.js';

describe('tripChecklistGenerationService', () => {
  beforeEach(() => {
    mocks.getGuideDocumentBySourceUrlMock.mockReset();
  });

  it('builds deduplicated drafts from ai summary, content blocks, and search summary', async () => {
    mocks.getGuideDocumentBySourceUrlMock.mockResolvedValue({
      aiSummary: {
        warnings: ['建议提前预约门票。', '建议提前预约门票。'],
        transportTips: ['记得确认酒店接驳车；'],
        routeTips: ['步行路线尽量避开午后高峰'],
        highlights: ['可以在傍晚去鸭川散步！'],
      },
      blocks: [
        { id: '1', type: 'tips', text: '建议带上轻便雨伞，现场天气变化快。' },
        { id: '2', type: 'bullet-list', text: '清水寺 - 二年坂 - 八坂神社' },
        { id: '3', type: 'paragraph', text: '适合清晨先去伏见稻荷，尽量避开中午。' },
      ],
    });

    const drafts = await buildGeneratedTripChecklistDrafts({
      guide: {
        sourceUrl: 'https://example.com/guide',
        summary: '京都经典路线与交通提醒',
      },
    } as never);

    expect(drafts).toHaveLength(8);
    expect(drafts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: '提前确认：建议提前预约门票',
          stage: 'pre_departure',
          sourceSnippet: '建议提前预约门票。',
        }),
        expect.objectContaining({
          title: '准备交通方案：记得确认酒店接驳车',
          stage: 'pre_departure',
        }),
        expect.objectContaining({
          title: '路线上留意：步行路线尽量避开午后高峰',
          stage: 'in_transit',
        }),
        expect.objectContaining({
          title: '别错过：可以在傍晚去鸭川散步',
          stage: 'in_transit',
        }),
        expect.objectContaining({
          title: '带上轻便雨伞，现场天气变化快',
        }),
        expect.objectContaining({
          title: '把这条路线排进计划：清水寺 - 二年坂 - 八坂神社',
          stage: 'in_transit',
        }),
      ]),
    );
    expect(new Set(drafts.map((item) => item.title.toLowerCase())).size).toBe(drafts.length);
  });

  it('falls back to search summary when document is unavailable or insufficient', async () => {
    mocks.getGuideDocumentBySourceUrlMock.mockResolvedValue(null);

    const drafts = await buildGeneratedTripChecklistDrafts({
      guide: {
        sourceUrl: 'https://example.com/guide',
        summary: '先看京都核心路线，再留意交通与节奏',
      },
    } as never);

    expect(drafts).toEqual([
      {
        title: '先把这篇攻略的核心路线排进计划：先看京都核心路线，再留意交通与节奏',
        stage: 'pre_departure',
        sourceSnippet: '先看京都核心路线，再留意交通与节奏',
      },
      {
        title: '旅途中重点留意攻略提到的节奏与交通安排',
        stage: 'in_transit',
        sourceSnippet: '先看京都核心路线，再留意交通与节奏',
      },
    ]);
  });

  it('truncates long snippets and caps output size to eight drafts', async () => {
    const longText = '建议'.repeat(150);
    mocks.getGuideDocumentBySourceUrlMock.mockResolvedValue({
      aiSummary: {
        warnings: Array.from({ length: 6 }, (_, index) => `提前确认事项 ${index}`),
        transportTips: ['准备交通方案 A', '准备交通方案 B'],
        routeTips: ['路线提示 A', '路线提示 B'],
        highlights: ['亮点 A', '亮点 B'],
      },
      blocks: [{ id: '1', type: 'tips', text: longText }],
    });

    const drafts = await buildGeneratedTripChecklistDrafts({
      guide: {
        sourceUrl: 'https://example.com/guide',
        summary: '摘要',
      },
    } as never);

    expect(drafts).toHaveLength(8);
    expect(drafts.every((item) => (item.sourceSnippet?.length ?? 0) <= 240)).toBe(true);
  });
});
